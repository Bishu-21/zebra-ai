/** Providers that may create or enter a Zebra session. LinkedIn and GitHub are link-only. */
export const SIGN_IN_SOCIAL_PROVIDERS = ["google"] as const;

export type SignInSocialProvider = (typeof SIGN_IN_SOCIAL_PROVIDERS)[number];
