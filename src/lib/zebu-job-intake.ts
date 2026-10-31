/** Finds a job URL only when the user is asking Zebu to work on a role. */
export function extractJobUrlFromZebuMessage(message: string): string | null {
  if (!/\b(match|tailor|analyse|analyze|compare|fit)\b/i.test(message) || !/\b(job|role|position|resume|cv)\b/i.test(message)) return null;
  const candidate = message.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[.,;!?)}\]]+$/, "");
  if (!candidate || candidate.length > 2_048) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
