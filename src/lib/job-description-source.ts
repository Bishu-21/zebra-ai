/** The source page is the evidence; model output must not replace its requirements. */
export function selectJobDescription(sourceText: string): string {
  const text = sourceText.replace(/\r\n?/g, "\n").trim();
  if (text.length < 80) throw new Error("The page exposed too little job text.");
  if (text.length > 100_000) throw new Error("The page text is too long to import safely.");
  return text;
}

export function fallbackJobFields(metadata: { h1?: string | null; title?: string | null; ogSiteName?: string | null }) {
  return {
    company: metadata.ogSiteName?.trim().slice(0, 255) || "",
    position: metadata.h1?.trim().slice(0, 255) || metadata.title?.split("|")[0]?.trim().slice(0, 255) || "",
    salary: "",
    location: "",
    jobType: "",
  };
}
