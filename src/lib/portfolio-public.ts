export type PublicWorkCandidate = {
    id: string;
    isPublic: boolean;
};

function selectedIdList(selectedWorkIds: unknown): string[] {
    if (!Array.isArray(selectedWorkIds)) return [];
    return selectedWorkIds.filter((id): id is string => typeof id === "string" && id.length > 0);
}

/**
 * Public portfolio visibility is driven by work marked public on the Work page.
 * A non-empty selectedWorkIds list can feature a subset; an empty list shows every public item.
 */
export function selectPublicPortfolioWork<T extends PublicWorkCandidate>(
    items: T[],
    selectedWorkIds: unknown,
): T[] {
    const publicItems = items.filter((item) => item.isPublic);
    const selected = selectedIdList(selectedWorkIds);
    if (selected.length === 0) return publicItems;
    const allow = new Set(selected);
    return publicItems.filter((item) => allow.has(item.id));
}

export function nextPortfolioWorkIds(selectedWorkIds: unknown, workId: string, isPublic: boolean): string[] | null {
    const selected = selectedIdList(selectedWorkIds);
    if (selected.length === 0) return null;
    if (isPublic) return Array.from(new Set([...selected, workId]));
    return selected.filter((id) => id !== workId);
}
