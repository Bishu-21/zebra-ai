import { z } from "zod";

export const linkedinDraftFieldSchema = z.enum(["headline", "about", "experience"]);
export const linkedinDraftDecisionSchema = z.enum(["proposed", "accepted", "dismissed"]);

export const linkedinDraftInputSchema = z.object({
  field: linkedinDraftFieldSchema,
  sourceQuote: z.string().trim().min(12).max(1500),
  proposedText: z.string().trim().min(15).max(3000),
  rationale: z.string().trim().max(500),
});

export const linkedinDraftResponseSchema = z.object({ drafts: z.array(linkedinDraftInputSchema).min(1).max(8) });

export const LINKEDIN_DRAFT_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  name: "zebra_linkedin_drafts",
  strict: true,
  schema: {
    type: "object", additionalProperties: false, required: ["drafts"], properties: {
      drafts: { type: "array", minItems: 1, maxItems: 8, items: {
        type: "object", additionalProperties: false,
        required: ["field", "sourceQuote", "proposedText", "rationale"], properties: {
          field: { type: "string", enum: ["headline", "about", "experience"] },
          sourceQuote: { type: "string" }, proposedText: { type: "string" }, rationale: { type: "string" },
        },
      } },
    },
  },
};

export interface LinkedInDraft extends z.infer<typeof linkedinDraftInputSchema> {
  id: string;
  status: z.infer<typeof linkedinDraftDecisionSchema>;
  editedText: string | null;
}

export function validateLinkedInProfileUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const match = url.pathname.match(/^\/in\/([a-zA-Z0-9_-]{3,100})\/?$/);
    if (url.protocol !== "https:" || !["linkedin.com", "www.linkedin.com"].includes(host) || !match || url.username || url.password || url.port) return null;
    return `https://www.linkedin.com/in/${match[1]}/`;
  } catch { return null; }
}

function factualTokens(value: string): string[] {
  const numbers = value.match(/\b\d+(?:[.,]\d+)*(?:%|[kKmMbB])?/g) || [];
  const urls = value.match(/https?:\/\/[^\s)]+/gi) || [];
  const emails = value.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) || [];
  return [...numbers, ...urls, ...emails].map(token => token.toLowerCase());
}

export function textHasUnsupportedFacts(proposedText: string, sourceText: string): boolean {
  const supported = new Set(factualTokens(sourceText));
  return factualTokens(proposedText).some(token => !supported.has(token));
}

export function findLinkedInSourceQuote(sourceText: string, value: string): string | null {
  const quote = value.trim().replace(/^["“”']|["“”']$/g, "");
  if (quote.length < 3) return null;
  if (sourceText.includes(quote)) return quote;
  const escaped = quote.split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  return sourceText.match(new RegExp(escaped))?.[0] || null;
}

export function validateLinkedInDrafts(sourceText: string, raw: unknown): LinkedInDraft[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.slice(0, 8).flatMap((candidate, index) => {
    const parsed = linkedinDraftInputSchema.safeParse(candidate);
    if (!parsed.success) return [];
    const draft = parsed.data;
    const exactQuote = findLinkedInSourceQuote(sourceText, draft.sourceQuote);
    if (!exactQuote || textHasUnsupportedFacts(draft.proposedText, exactQuote)) return [];
    const key = `${draft.field}:${exactQuote}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...draft, sourceQuote: exactQuote, id: `${draft.field}-${index + 1}`, status: "proposed" as const, editedText: null }];
  });
}

export function updateLinkedInDraftDecision(drafts: readonly LinkedInDraft[], draftId: string, status: "accepted" | "dismissed", editedText: string | undefined, sourceText: string): LinkedInDraft[] {
  if (!drafts.some(draft => draft.id === draftId)) throw new Error("Draft not found.");
  const text = editedText?.trim() || null;
  return drafts.map(draft => {
    if (draft.id !== draftId) return draft;
    if (status === "accepted" && text) {
      if (text.length < 15 || text.length > 3000 || textHasUnsupportedFacts(text, sourceText)) throw new Error("Edited text adds an unsupported number, link, email, or exceeds the length limit.");
    }
    return { ...draft, status, editedText: status === "accepted" ? text : null };
  });
}
