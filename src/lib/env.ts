import { z } from "zod";

const optionalText = z.string().trim().min(1).optional();
const serverEnvironmentSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: optionalText,
    BETTER_AUTH_SECRET: optionalText,
    BETTER_AUTH_URL: optionalText,
    NEXT_PUBLIC_APP_URL: optionalText,
    NEXT_PUBLIC_SUPPORT_EMAIL: optionalText,
    VERCEL_URL: optionalText,
    AZURE_FOUNDRY_OPENAI_BASE_URL: optionalText,
    AZURE_FOUNDRY_API_KEY: optionalText,
    AZURE_FOUNDRY_DEPLOYMENT: optionalText,
    GEMINI_API_KEY: optionalText,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: optionalText,
    RAZORPAY_KEY_SECRET: optionalText,
    RESEND_API_KEY: optionalText,
    EMAIL_FROM: optionalText,
    GITHUB_APP_ID: optionalText,
    GITHUB_APP_PRIVATE_KEY: optionalText,
    GITHUB_APP_SLUG: optionalText,
    GITHUB_WEBHOOK_SECRET: optionalText,
}).superRefine((env, context) => {
    const production = env.NODE_ENV === "production";
    if (production && !env.DATABASE_URL) {
        context.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "is required in production" });
    }
    if (production && (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)) {
        context.addIssue({ code: "custom", path: ["BETTER_AUTH_SECRET"], message: "must contain at least 32 characters in production" });
    }
    if (production && !env.BETTER_AUTH_URL && !env.NEXT_PUBLIC_APP_URL && !env.VERCEL_URL) {
        context.addIssue({ code: "custom", path: ["BETTER_AUTH_URL"], message: "a trusted production origin is required" });
    }
    const azureValues = [env.AZURE_FOUNDRY_OPENAI_BASE_URL, env.AZURE_FOUNDRY_API_KEY, env.AZURE_FOUNDRY_DEPLOYMENT];
    if (azureValues.some(Boolean) && !azureValues.every(Boolean)) {
        context.addIssue({ code: "custom", path: ["AZURE_FOUNDRY_OPENAI_BASE_URL"], message: "Azure base URL, API key, and deployment must be configured together" });
    }
    if (Boolean(env.NEXT_PUBLIC_RAZORPAY_KEY_ID) !== Boolean(env.RAZORPAY_KEY_SECRET)) {
        context.addIssue({ code: "custom", path: ["RAZORPAY_KEY_SECRET"], message: "Razorpay public and secret keys must be configured together" });
    }
    if (Boolean(env.RESEND_API_KEY) !== Boolean(env.EMAIL_FROM)) {
        context.addIssue({ code: "custom", path: ["EMAIL_FROM"], message: "Resend API key and sender address must be configured together" });
    }
    const githubApp = [env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY, env.GITHUB_APP_SLUG, env.GITHUB_WEBHOOK_SECRET];
    if (githubApp.some(Boolean) && !githubApp.every(Boolean)) {
        context.addIssue({ code: "custom", path: ["GITHUB_APP_ID"], message: "GitHub App id, private key, slug, and webhook secret must be configured together" });
    }
    if (env.GITHUB_APP_PRIVATE_KEY && !env.GITHUB_APP_PRIVATE_KEY.includes("PRIVATE KEY")) {
        context.addIssue({ code: "custom", path: ["GITHUB_APP_PRIVATE_KEY"], message: "must be a PEM private key" });
    }
    if (env.GITHUB_APP_SLUG && !/^[A-Za-z0-9-]+$/.test(env.GITHUB_APP_SLUG)) {
        context.addIssue({ code: "custom", path: ["GITHUB_APP_SLUG"], message: "must contain only letters, numbers, and hyphens" });
    }
});

export function isGitHubAppConfigured(environment: NodeJS.ProcessEnv = process.env): boolean {
    return Boolean(
        environment.GITHUB_APP_ID
        && environment.GITHUB_APP_PRIVATE_KEY
        && environment.GITHUB_APP_SLUG
        && environment.GITHUB_WEBHOOK_SECRET,
    );
}

export function validateServerEnvironment(environment: NodeJS.ProcessEnv = process.env): void {
    const result = serverEnvironmentSchema.safeParse(environment);
    if (result.success) return;
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid server environment: ${details}`);
}
