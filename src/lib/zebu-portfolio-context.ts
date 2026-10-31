export function summarizePortfolioProofContext(items: Array<{ id: string; title: string; proofUrl: string | null }>) {
  return {
    listedWorkItemCount: Math.min(items.length, 50),
    moreAvailable: items.length > 50,
    items: items.slice(0, 50).map((item) => ({ id: item.id, title: item.title, hasProof: Boolean(item.proofUrl) })),
    nextStep: items.length ? "choose_existing_or_new" as const : "collect_new_project" as const,
  };
}
