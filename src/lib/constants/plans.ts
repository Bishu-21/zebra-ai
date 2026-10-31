export const PLANS = {
    starter: {
        id: "starter",
        name: "10 credits",
        credits: 10,
        priceInINR: 99,
        displayPrice: "₹99",
    },
    pro: {
        id: "pro",
        name: "50 credits",
        credits: 50,
        priceInINR: 400,
        displayPrice: "₹400",
    },
    enterprise: {
        id: "enterprise",
        name: "100 credits",
        credits: 100,
        priceInINR: 800,
        displayPrice: "₹800",
    },
} as const;

export type PlanId = keyof typeof PLANS;

const PACK_PLAN_IDS = new Set<string>(Object.keys(PLANS));
const PACK_PLAN_NAMES = new Set<string>(Object.values(PLANS).map((pack) => pack.name));

/** Sidebar/settings label. Pack names already include “credits”; do not append “Plan”. */
export function formatAccountPlanLabel(plan: string | null | undefined): string {
    const value = (plan || "Free").trim();
    if (!value || value === "Free") return "Free plan";
    if (PACK_PLAN_IDS.has(value) || PACK_PLAN_NAMES.has(value)) return "Pay-as-you-go";
    return value;
}
