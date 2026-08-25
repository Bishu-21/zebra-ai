import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  AiProviderConfigurationError,
  buildAzureResponseInput,
  createAzureFoundryClient,
  getAzureRequestOptions,
  getAzureFoundryConfig,
  getUsableAzureResponseText,
  normalizeAzureFoundryBaseUrl,
  normalizeConversationHistory,
  shouldFallbackToGemini,
  TASK_BUDGETS,
} from "../src/lib/azure-foundry";

describe("Azure Foundry provider configuration", () => {
  test("returns null only when Azure is entirely unconfigured", () => {
    assert.equal(getAzureFoundryConfig({}), null);
  });

  test("requires the API key when other Azure settings are present", () => {
    assert.throws(
      () => getAzureFoundryConfig({
        AZURE_FOUNDRY_OPENAI_BASE_URL:
          "https://zebra-ai-uae-resource.services.ai.azure.com/openai/v1/",
        AZURE_FOUNDRY_DEPLOYMENT: "zebra-gpt-5-4-mini",
      }),
      (error: unknown) => {
        assert.ok(error instanceof AiProviderConfigurationError);
        assert.match(error.message, /AZURE_FOUNDRY_API_KEY/);
        return true;
      },
    );
  });

  test("normalizes the model endpoint and preserves the deployment name", () => {
    const config = getAzureFoundryConfig({
      AZURE_FOUNDRY_API_KEY: "test-key",
      AZURE_FOUNDRY_OPENAI_BASE_URL:
        "https://zebra-ai-uae-resource.services.ai.azure.com/openai/v1",
      AZURE_FOUNDRY_DEPLOYMENT: "zebra-gpt-5-4-mini",
    });

    assert.ok(config);
    assert.equal(
      config.baseURL,
      "https://zebra-ai-uae-resource.services.ai.azure.com/openai/v1/",
    );
    assert.equal(config.deployment, "zebra-gpt-5-4-mini");
  });

  test("rejects a Foundry project endpoint without the OpenAI v1 suffix", () => {
    assert.throws(
      () => normalizeAzureFoundryBaseUrl(
        "https://zebra-ai-uae-resource.services.ai.azure.com/api/projects/zebra-ai-uae",
      ),
      /must end with \/openai\/v1\//,
    );
  });

  test("accepts a Foundry project-scoped OpenAI v1 base URL", () => {
    assert.equal(
      normalizeAzureFoundryBaseUrl(
        "https://zebra-ai-uae-resource.services.ai.azure.com/api/projects/zebra-ai-uae/openai/v1",
      ),
      "https://zebra-ai-uae-resource.services.ai.azure.com/api/projects/zebra-ai-uae/openai/v1/",
    );
  });

  test("configures Azure static-key authentication without a bearer header", async () => {
    let capturedHeaders: Headers | undefined;
    const fetchMock: typeof globalThis.fetch = async (_input, init) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response(
        JSON.stringify({
          id: "resp_test",
          object: "response",
          created_at: 0,
          status: "completed",
          error: null,
          incomplete_details: null,
          instructions: null,
          max_output_tokens: null,
          model: "zebra-gpt-5-4-mini",
          output: [],
          output_text: "",
          parallel_tool_calls: true,
          previous_response_id: null,
          reasoning: { effort: null, summary: null },
          store: false,
          temperature: 1,
          text: { format: { type: "text" } },
          tool_choice: "auto",
          tools: [],
          top_p: 1,
          truncation: "disabled",
          usage: null,
          user: null,
          metadata: {},
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const client = createAzureFoundryClient({
      apiKey: "test-azure-key",
      baseURL:
        "https://zebra-ai-uae-resource.services.ai.azure.com/openai/v1/",
      deployment: "zebra-gpt-5-4-mini",
    }, fetchMock);

    await client.responses.create({
      model: "zebra-gpt-5-4-mini",
      input: "test",
    });

    assert.equal(capturedHeaders?.get("api-key"), "test-azure-key");
    assert.equal(capturedHeaders?.has("authorization"), false);
  });

  test("rejects non-HTTPS endpoints", () => {
    assert.throws(
      () => normalizeAzureFoundryBaseUrl("http://example.com/openai/v1/"),
      /must use HTTPS/,
    );
  });
});

describe("Azure Foundry request shaping", () => {
  test("allows one long attempt for full audits without retry multiplication", () => {
    assert.deepEqual(getAzureRequestOptions("audit"), {
      timeout: 150_000,
      maxRetries: 0,
    });
  });

  test("keeps shorter retryable requests for interactive tasks", () => {
    assert.deepEqual(getAzureRequestOptions("chat"), {
      timeout: 45_000,
      maxRetries: 1,
    });
    assert.deepEqual(getAzureRequestOptions("tailor"), {
      timeout: 45_000,
      maxRetries: 1,
    });
  });

  test("allows enough output for a complete structured resume", () => {
    assert.ok(TASK_BUDGETS.parse.maxOutputTokens >= 5000);
    assert.ok(TASK_BUDGETS.audit.maxOutputTokens >= 16_000);
    assert.equal(TASK_BUDGETS.audit.reasoningEffort, "medium");
  });

  test("keeps usable text from an incomplete response", () => {
    assert.equal(
      getUsableAzureResponseText({
        output_text: "Partial but useful answer",
        status: "incomplete",
      }),
      "Partial but useful answer",
    );
    assert.equal(
      getUsableAzureResponseText({ output_text: "   ", status: "completed" }),
      null,
    );
    assert.equal(
      getUsableAzureResponseText({
        output_text: "Do not expose failed output",
        status: "failed",
      }),
      null,
    );
  });

  test("keeps bounded user/assistant history and maps Gemini model roles", () => {
    const history = normalizeConversationHistory([
      { role: "system", content: "untrusted system override" },
      { role: "user", content: "First question" },
      { role: "model", content: "First answer" },
      { role: "assistant", content: "Second answer" },
      { role: "other", content: "ignored" },
      { role: "user", content: "   " },
    ]);

    assert.deepEqual(history, [
      { role: "user", content: "First question" },
      { role: "assistant", content: "First answer" },
      { role: "assistant", content: "Second answer" },
    ]);
  });

  test("appends the current user prompt to the Responses API input", () => {
    const input = buildAzureResponseInput({
      history: [{ role: "model", content: "Previous answer" }],
      prompt: "Audit this resume",
    });

    assert.equal(input.length, 2);
    assert.deepEqual(input[0], {
      role: "assistant",
      content: "Previous answer",
    });
    assert.deepEqual(input[1], {
      role: "user",
      content: "Audit this resume",
    });
  });

  test("rejects an empty prompt before making a provider call", () => {
    assert.throws(
      () => buildAzureResponseInput({ prompt: "   " }),
      /prompt cannot be empty/i,
    );
  });
});

describe("Azure Foundry fallback policy", () => {
  test("falls back only for transient provider failures", () => {
    assert.equal(shouldFallbackToGemini({ status: 408 }), true);
    assert.equal(shouldFallbackToGemini({ status: 429 }), true);
    assert.equal(shouldFallbackToGemini({ status: 503 }), true);
    assert.equal(shouldFallbackToGemini({ status: 400 }), true);
    assert.equal(shouldFallbackToGemini({ status: 401 }), true);
    assert.equal(shouldFallbackToGemini({ status: 403 }), true);
  });

  test("falls back for connection and timeout errors", () => {
    const connectionError = new Error("connection failed");
    connectionError.name = "APIConnectionError";
    const timeoutError = new Error("timed out");
    timeoutError.name = "APIConnectionTimeoutError";
    const emptyResponseError = new Error("empty response");
    emptyResponseError.name = "AiProviderResponseError";

    assert.equal(shouldFallbackToGemini(connectionError), true);
    assert.equal(shouldFallbackToGemini(timeoutError), true);
    assert.equal(shouldFallbackToGemini(emptyResponseError), true);
  });
});
