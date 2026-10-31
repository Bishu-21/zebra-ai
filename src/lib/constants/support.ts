export const SUPPORT_EMAIL = "accounts@zebra-ai.app";

export function getSupportEmail(
    environment: Record<string, string | undefined> = process.env,
): string {
    return environment.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || SUPPORT_EMAIL;
}
