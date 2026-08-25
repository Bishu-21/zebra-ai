const WAKE_WORD_PATTERN = /\b(?:hey|hi|okay|ok)\s+z(?:e|ee)bu\b/i;

export function containsZebuWakeWord(transcript: string): boolean {
  const normalized = transcript
    .normalize("NFKD")
    .replace(/[^a-z\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return WAKE_WORD_PATTERN.test(normalized);
}
