export function buildZebuSessionContinuity(rawHandle?: string) {
  if (rawHandle && rawHandle.length > 8_192) throw new Error("Invalid Live resume handle.");
  const handle = rawHandle?.trim();
  return {
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: handle ? { handle } : {},
  };
}
