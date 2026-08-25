import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

export type TaskType =
  | "chat"
  | "audit"
  | "tailor"
  | "copilot"
  | "zebu"
  | "parse"
  | "cover-letter"
  | "job-extraction"
  | "project";

export interface TaskBudget {
  maxOutputTokens: number;
  reasoningEffort: "low" | "medium" | "high";
}

export const TASK_BUDGETS: Record<TaskType, TaskBudget> = {
  chat: { maxOutputTokens: 1200, reasoningEffort: "low" },
  copilot: { maxOutputTokens: 500, reasoningEffort: "low" },
  zebu: { maxOutputTokens: 500, reasoningEffort: "low" },
  audit: { maxOutputTokens: 16_000, reasoningEffort: "medium" },
  tailor: { maxOutputTokens: 3000, reasoningEffort: "medium" },
  parse: { maxOutputTokens: 5000, reasoningEffort: "low" },
  "cover-letter": { maxOutputTokens: 2200, reasoningEffort: "medium" },
  "job-extraction": { maxOutputTokens: 900, reasoningEffort: "low" },
  project: { maxOutputTokens: 2000, reasoningEffort: "medium" },
};

export const DEFAULT_AZURE_REQUEST_OPTIONS = {
  timeout: 45_000,
  maxRetries: 1,
} as const;

export const AUDIT_AZURE_REQUEST_OPTIONS = {
  timeout: 150_000,
  maxRetries: 0,
} as const;

export function getAzureRequestOptions(task: TaskType) {
  return task === "audit"
    ? AUDIT_AZURE_REQUEST_OPTIONS
    : DEFAULT_AZURE_REQUEST_OPTIONS;
}

const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_MESSAGE_CHARS = 12_000;
const MAX_PROMPT_CHARS = 320_000;
const MAX_SYSTEM_PROMPT_CHARS = 80_000;

export interface AzureFoundryConfig {
  apiKey: string;
  baseURL: string;
  deployment: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerationOptions {
  task: TaskType;
  prompt: string;
  systemPrompt?: string;
  history?: unknown;
  responseFormat?: OpenAI.Responses.ResponseFormatTextJSONSchemaConfig;
  onStreamFailure?: (error: unknown) => Promise<void> | void;
  allowGeminiFallback?: boolean;
  preferGemini?: boolean;
}

export class AiProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderConfigurationError";
  }
}

class AiProviderResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderResponseError";
  }
}

let cachedOpenAIClient:
  | { apiKey: string; baseURL: string; client: OpenAI }
  | null = null;
let cachedGeminiClient:
  | { apiKey: string; client: GoogleGenAI }
  | null = null;

function readEnv(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string | undefined {
  const value = env[name]?.trim();
  return value || undefined;
}

export function normalizeAzureFoundryBaseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new AiProviderConfigurationError(
      "AZURE_FOUNDRY_OPENAI_BASE_URL must be a valid URL.",
    );
  }

  if (url.protocol !== "https:") {
    throw new AiProviderConfigurationError(
      "AZURE_FOUNDRY_OPENAI_BASE_URL must use HTTPS.",
    );
  }

  const pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  if (!pathname.endsWith("/openai/v1/")) {
    throw new AiProviderConfigurationError(
      "AZURE_FOUNDRY_OPENAI_BASE_URL must end with /openai/v1/. Append that path to either the Azure OpenAI resource endpoint or the Foundry project endpoint.",
    );
  }

  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.toString();
}

/**
 * Returns null when Azure is entirely unconfigured so Gemini can remain the
 * development fallback. A partially configured Azure provider is an error.
 */
export function getAzureFoundryConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AzureFoundryConfig | null {
  const rawBaseURL = readEnv(env, "AZURE_FOUNDRY_OPENAI_BASE_URL");
  const apiKey = readEnv(env, "AZURE_FOUNDRY_API_KEY");
  const deployment = readEnv(env, "AZURE_FOUNDRY_DEPLOYMENT");

  if (!rawBaseURL && !apiKey && !deployment) return null;

  const missing = [
    ["AZURE_FOUNDRY_OPENAI_BASE_URL", rawBaseURL],
    ["AZURE_FOUNDRY_API_KEY", apiKey],
    ["AZURE_FOUNDRY_DEPLOYMENT", deployment],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new AiProviderConfigurationError(
      `Azure Foundry configuration is incomplete. Missing: ${missing.join(", ")}.`,
    );
  }

  return {
    apiKey: apiKey!,
    baseURL: normalizeAzureFoundryBaseUrl(rawBaseURL!),
    deployment: deployment!,
  };
}

/**
 * Build an OpenAI-compatible client using Azure's static-key authentication.
 *
 * The generic OpenAI client otherwise treats `apiKey` as a bearer token. Azure
 * Foundry static keys must be sent in the `api-key` header, so explicitly set
 * that header and remove the automatically generated Authorization header.
 */
export function createAzureFoundryClient(
  config: AzureFoundryConfig,
  fetchImplementation?: typeof globalThis.fetch,
): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    defaultHeaders: {
      "api-key": config.apiKey,
      Authorization: null,
    },
    maxRetries: DEFAULT_AZURE_REQUEST_OPTIONS.maxRetries,
    timeout: DEFAULT_AZURE_REQUEST_OPTIONS.timeout,
    fetch: fetchImplementation,
  });
}

function getAzureFoundryClient(config: AzureFoundryConfig): OpenAI {
  if (
    cachedOpenAIClient?.apiKey === config.apiKey &&
    cachedOpenAIClient.baseURL === config.baseURL
  ) {
    return cachedOpenAIClient.client;
  }

  const client = createAzureFoundryClient(config);

  cachedOpenAIClient = {
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    client,
  };
  return client;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  if (cachedGeminiClient?.apiKey === apiKey) return cachedGeminiClient.client;

  const client = new GoogleGenAI({ apiKey });
  cachedGeminiClient = { apiKey, client };
  return client;
}

function clipText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n[Input truncated by Zebra AI]`;
}

export function normalizeConversationHistory(
  value: unknown,
): ConversationMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_HISTORY_MESSAGES)
    .flatMap((item): ConversationMessage[] => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const role = record.role === "model" ? "assistant" : record.role;
      if (role !== "user" && role !== "assistant") return [];
      if (typeof record.content !== "string") return [];

      const content = record.content.trim();
      if (!content) return [];
      return [{ role, content: clipText(content, MAX_HISTORY_MESSAGE_CHARS) }];
    });
}

export function buildAzureResponseInput(
  options: Pick<GenerationOptions, "history" | "prompt">,
): OpenAI.Responses.ResponseInput {
  const prompt = options.prompt.trim();
  if (!prompt) throw new AiProviderConfigurationError("AI prompt cannot be empty.");

  const history: OpenAI.Responses.EasyInputMessage[] =
    normalizeConversationHistory(options.history).map((message) => ({
      role: message.role,
      content: message.content,
    }));

  return [
    ...history,
    { role: "user", content: clipText(prompt, MAX_PROMPT_CHARS) },
  ];
}

function buildAzureRequest(
  options: GenerationOptions,
  config: AzureFoundryConfig,
) {
  const budget = TASK_BUDGETS[options.task];
  return {
    model: config.deployment,
    instructions: options.systemPrompt
      ? clipText(options.systemPrompt, MAX_SYSTEM_PROMPT_CHARS)
      : undefined,
    input: buildAzureResponseInput(options),
    max_output_tokens: budget.maxOutputTokens,
    reasoning: { effort: budget.reasoningEffort },
    text: options.responseFormat ? { format: options.responseFormat } : undefined,
    store: false,
  } satisfies OpenAI.Responses.ResponseCreateParamsNonStreaming;
}

export function getUsableAzureResponseText(
  response: Pick<OpenAI.Responses.Response, "output_text" | "status">,
): string | null {
  const hasUsableStatus =
    response.status === "completed" || response.status === "incomplete";
  return hasUsableStatus && response.output_text?.trim()
    ? response.output_text
    : null;
}

function describeAzureResponseEnd(response: OpenAI.Responses.Response): string {
  const reason = response.incomplete_details?.reason;
  const status = response.status ?? "with an unknown status";
  return reason ? `${status} (${reason})` : status;
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as Record<string, unknown>).status;
  return typeof status === "number" ? status : undefined;
}

export function shouldFallbackToGemini(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status !== undefined) {
    return status >= 400;
  }

  const name = error instanceof Error ? error.name : "";
  return [
    "APIConnectionError",
    "APIConnectionTimeoutError",
    "AiProviderResponseError",
    "TimeoutError",
  ].includes(name);
}

function getConfiguredAzureOrFallback(
  gemini: GoogleGenAI | null,
): AzureFoundryConfig | null {
  try {
    return getAzureFoundryConfig();
  } catch (error) {
    if (!gemini || !(error instanceof AiProviderConfigurationError)) throw error;
    console.warn(
      `[AI] ${error.message} Using the configured Gemini fallback.`,
    );
    return null;
  }
}

function logAzureFallback(task: TaskType, error: unknown): void {
  const status = getErrorStatus(error);
  const reason = status ? `HTTP ${status}` : error instanceof Error ? error.name : "unknown error";
  console.warn(`[AI] Azure Foundry ${task} request failed (${reason}); using Gemini fallback.`);
}

function getGeminiModel(task: TaskType): string {
  if (task === "chat" && process.env.CHAT_MODEL) return process.env.CHAT_MODEL;
  if (task === "copilot" && process.env.COPILOT_MODEL) return process.env.COPILOT_MODEL;
  return process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
}

function buildGeminiContents(options: GenerationOptions) {
  const history = normalizeConversationHistory(options.history).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  return [
    ...history,
    {
      role: "user",
      parts: [{ text: clipText(options.prompt.trim(), MAX_PROMPT_CHARS) }],
    },
  ];
}

async function generateGeminiResponse(
  options: GenerationOptions,
  gemini: GoogleGenAI,
): Promise<string> {
  const budget = TASK_BUDGETS[options.task];
  const result = await gemini.models.generateContent({
    model: getGeminiModel(options.task),
    contents: buildGeminiContents(options),
    config: {
      maxOutputTokens: budget.maxOutputTokens,
      systemInstruction: options.systemPrompt,
      responseMimeType: options.responseFormat ? "application/json" : undefined,
      responseJsonSchema: options.responseFormat?.schema,
    },
  });

  const text = result.text || "";
  if (!text.trim()) throw new AiProviderResponseError("Gemini returned an empty response.");
  return text;
}

/** Generate a complete text response with a transient-error Gemini fallback. */
export async function generateAiResponse(
  options: GenerationOptions,
): Promise<string> {
  const gemini = options.allowGeminiFallback === false ? null : getGeminiClient();
  if (options.preferGemini && gemini) return generateGeminiResponse(options, gemini);
  const azureConfig = getConfiguredAzureOrFallback(gemini);

  if (azureConfig) {
    try {
      const client = getAzureFoundryClient(azureConfig);
      const response = await client.responses.create(
        buildAzureRequest(options, azureConfig),
        getAzureRequestOptions(options.task),
      );

      const responseText = getUsableAzureResponseText(response);
      if (responseText) return responseText;

      throw new AiProviderResponseError(
        `Azure Foundry returned no text; response ended ${describeAzureResponseEnd(response)}.`,
      );
    } catch (error) {
      if (!gemini || !shouldFallbackToGemini(error)) throw error;
      logAzureFallback(options.task, error);
    }
  }

  if (gemini) return generateGeminiResponse(options, gemini);

  throw new AiProviderConfigurationError(
    "No AI provider is configured. Add the Azure Foundry API key or a Gemini API key.",
  );
}

async function notifyStreamFailure(
  callback: GenerationOptions["onStreamFailure"],
  error: unknown,
): Promise<void> {
  if (!callback) return;
  try {
    await callback(error);
  } catch (callbackError) {
    const name = callbackError instanceof Error ? callbackError.name : "unknown error";
    console.error(`[AI] Stream failure callback failed (${name}).`);
  }
}

/**
 * Stream plain UTF-8 text. Azure is primary; Gemini is used only when Azure
 * fails transiently before any Azure text has reached the caller.
 */
export async function generateAiStream(
  options: GenerationOptions,
): Promise<ReadableStream<Uint8Array>> {
  const gemini = getGeminiClient();
  const azureConfig = getConfiguredAzureOrFallback(gemini);

  if (!azureConfig && !gemini) {
    throw new AiProviderConfigurationError(
      "No AI provider is configured. Add the Azure Foundry API key or a Gemini API key.",
    );
  }

  const encoder = new TextEncoder();
  let cancelled = false;
  let activeAzureStream: { abort: () => void } | null = null;
  const geminiAbortController = new AbortController();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let azureTextEmitted = false;

        if (azureConfig) {
          try {
            const client = getAzureFoundryClient(azureConfig);
            const azureStream = client.responses.stream(
              buildAzureRequest(options, azureConfig),
              getAzureRequestOptions(options.task),
            );
            activeAzureStream = azureStream;

            for await (const event of azureStream) {
              if (cancelled) return;
              if (event.type === "response.output_text.delta" && event.delta) {
                azureTextEmitted = true;
                controller.enqueue(encoder.encode(event.delta));
              }
            }

            const finalResponse = await azureStream.finalResponse();
            const finalText = getUsableAzureResponseText(finalResponse);
            if (!azureTextEmitted && finalText) {
              azureTextEmitted = true;
              controller.enqueue(encoder.encode(finalText));
            }
            if (!azureTextEmitted) {
              throw new AiProviderResponseError(
                `Azure Foundry returned no streamed text; response ended ${describeAzureResponseEnd(finalResponse)}.`,
              );
            }
            if (
              finalResponse.status !== "completed" &&
              finalResponse.status !== "incomplete"
            ) {
              throw new AiProviderResponseError(
                `Azure Foundry stream ended ${describeAzureResponseEnd(finalResponse)}.`,
              );
            }

            controller.close();
            return;
          } catch (error) {
            if (cancelled) return;
            if (azureTextEmitted || !gemini || !shouldFallbackToGemini(error)) {
              throw error;
            }
            logAzureFallback(options.task, error);
          }
        }

        if (!gemini) {
          throw new AiProviderConfigurationError("Gemini fallback is not configured.");
        }

        const budget = TASK_BUDGETS[options.task];
        const geminiStream = await gemini.models.generateContentStream({
          model: getGeminiModel(options.task),
          contents: buildGeminiContents(options),
          config: {
            abortSignal: geminiAbortController.signal,
            maxOutputTokens: budget.maxOutputTokens,
            systemInstruction: options.systemPrompt,
          },
        });

        let geminiTextEmitted = false;
        for await (const chunk of geminiStream) {
          if (cancelled) return;
          const text = chunk.text || "";
          if (text) {
            geminiTextEmitted = true;
            controller.enqueue(encoder.encode(text));
          }
        }

        if (!geminiTextEmitted) {
          throw new AiProviderResponseError("Gemini returned an empty stream.");
        }
        controller.close();
      } catch (error) {
        if (cancelled) return;
        await notifyStreamFailure(options.onStreamFailure, error);
        controller.error(new Error("AI response stream failed."));
      }
    },
    cancel() {
      cancelled = true;
      activeAzureStream?.abort();
      geminiAbortController.abort();
    },
  });
}
