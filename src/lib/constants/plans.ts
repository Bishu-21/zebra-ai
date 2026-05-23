export const PLANS = {
    starter: {
        id: "starter",
        name: "Plains Zebra",
        credits: 5,
        priceInINR: 99,
        displayPrice: "₹99",
    },
    pro: {
        id: "pro",
        name: "Mountain Zebra",
        credits: 50,
        priceInINR: 499,
        displayPrice: "₹499",
    },
    enterprise: {
        id: "enterprise",
        name: "Grevy's Zebra",
        credits: 200,
        priceInINR: 1299,
        displayPrice: "₹1299",
    },
} as const;

export type PlanId = keyof typeof PLANS;
