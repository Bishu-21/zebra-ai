export interface AiUsageHistoryRow {
    id: string;
    operationName: string;
    provider: string | null;
    creditsCost: number;
    status: string;
    createdAt: Date;
}

export interface AiUsageHistoryEntry {
    id: string;
    operation: string;
    provider: string;
    credits: number;
    status: string;
    createdAt: string;
}

const PROVIDER_LABELS: Record<string, string> = {
    "azure-foundry": "Azure Foundry",
    azure: "Azure Foundry",
    gemini: "Gemini",
};

function sentenceCase(value: string): string {
    const spaced = value.replace(/[_-]+/g, " ").trim();
    return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "AI operation";
}

export function presentAiUsageEntry(row: AiUsageHistoryRow): AiUsageHistoryEntry {
    return {
        id: row.id,
        operation: sentenceCase(row.operationName),
        provider: row.provider ? (PROVIDER_LABELS[row.provider.toLowerCase()] ?? sentenceCase(row.provider)) : "Not recorded",
        credits: row.creditsCost,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
    };
}
