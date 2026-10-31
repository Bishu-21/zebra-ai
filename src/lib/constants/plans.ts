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
