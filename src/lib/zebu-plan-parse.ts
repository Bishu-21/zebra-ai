import { zebuPlanSchema, type ZebuPlan } from "@/lib/zebu-contract";

function extractJsonObject(value: string): unknown {
  const trimmed = value.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The AI response did not contain a JSON object.");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function spokenFromUnknown(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 2_000);
}

/** Turn a model string into a Zebu plan, keeping a spoken reply when JSON is imperfect. */
export function parseZebuPlan(raw: string): ZebuPlan {
  let parsed: unknown;
  try {
    parsed = extractJsonObject(raw);
  } catch {
    const spoken = raw.trim().slice(0, 2_000);
    if (spoken) return { spokenResponse: spoken, action: { type: "none" } };
    throw new Error("Zebu returned an empty reply.");
  }

  const result = zebuPlanSchema.safeParse(parsed);
  if (result.success) return result.data;

  const record = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};
  const spoken = spokenFromUnknown(record.spokenResponse);
  if (spoken) return { spokenResponse: spoken, action: { type: "none" } };
  throw new Error("Zebu returned an unreadable reply.");
}
