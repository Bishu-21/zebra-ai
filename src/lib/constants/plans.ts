export const PLANS = {
    starter: {
        id: "starter",
        name: "Mini-Pack",
        credits: 5,
        priceInINR: 99,
        displayPrice: "₹99",
    },
    pro: {
        id: "pro",
        name: "Professional",
        credits: 50,
        priceInINR: 499,
        displayPrice: "₹499",
    },
    enterprise: {
        id: "enterprise",
        name: "Elite",
        credits: 200,
        priceInINR: 1299,
        displayPrice: "₹1299",
    },
} as const;

export type PlanId = keyof typeof PLANS;
