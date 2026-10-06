import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, sanitizeSecretText } from "./db";
import * as schema from "./schema";
import { isTransactionalEmailConfigured, sendTransactionalEmail } from "./transactional-email";

/** Signed-in linking may proceed when the provider omits a verified email. Signed-out auto-link stays off. */
export const ACCOUNT_LINKING = {
	enabled: true,
	disableImplicitLinking: true,
	allowDifferentEmails: true,
	updateUserInfoOnLink: false,
	trustedProviders: ["linkedin", "github"],
} as const;

type SocialEnv = Record<string, string | undefined>;

/** Identity-link providers. GitHub stays on read:user and user:email; repository reads use the App installation. */
export function buildSocialProviders(env: SocialEnv) {
	const google = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
	const linkedin = Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET);
	const github = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
	return {
		...(google ? { google: {
			clientId: env.GOOGLE_CLIENT_ID!,
			clientSecret: env.GOOGLE_CLIENT_SECRET!,
		} } : {}),
		...(linkedin ? { linkedin: {
			clientId: env.LINKEDIN_CLIENT_ID!,
			clientSecret: env.LINKEDIN_CLIENT_SECRET!,
			disableSignUp: true,
		} } : {}),
		...(github ? { github: {
			clientId: env.GITHUB_CLIENT_ID!,
			clientSecret: env.GITHUB_CLIENT_SECRET!,
			disableSignUp: true,
			disableDefaultScope: true,
			scope: ["read:user", "user:email"],
		} } : {}),
	};
}

/**
 * Resolves the effective base URL for Better Auth across local, preview, and production deployments.
 * Priority:
 * 1. BETTER_AUTH_URL environment variable
 * 2. NEXT_PUBLIC_APP_URL environment variable
 * 3. VERCEL_URL environment variable (prefixed with https://)
 * 4. Fallback to http://localhost:3000 for local development
 */
export function getAuthBaseURL(): string {
	if (process.env.BETTER_AUTH_URL) {
		return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
	}
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
	}
	if (process.env.VERCEL_URL) {
		const vercelHost = process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
		return `https://${vercelHost}`;
	}
	if (process.env.NODE_ENV === "production") {
		throw new Error("BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL must be configured in production.");
	}
	return "http://localhost:3000";
}

/**
 * Resolves trusted origins for CORS and callback verification across local, preview, and production.
 */
export function getTrustedOrigins(): string[] {
	const origins: string[] = [];
	const resolvedBase = getAuthBaseURL();
	if (resolvedBase) {
		origins.push(resolvedBase);
	}

	if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
		const parsed = process.env.BETTER_AUTH_TRUSTED_ORIGINS
			.split(",")
			.map((o) => o.trim().replace(/\/$/, ""))
			.filter(Boolean);
		origins.push(...parsed);
	}

	if (process.env.VERCEL_URL) {
		const vercelHost = process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
		origins.push(`https://${vercelHost}`);
	}
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		const vercelProdHost = process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
		origins.push(`https://${vercelProdHost}`);
	}

	// Always allow local development origins in non-production
	if (process.env.NODE_ENV !== "production") {
		origins.push("http://localhost:3000", "http://127.0.0.1:3000");
	}

	return Array.from(new Set(origins));
}

function authLogValue(value: unknown): string {
	if (value instanceof Error) return value.stack || value.message;
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

export const auth = betterAuth({
	baseURL: getAuthBaseURL(),
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	user: {
		additionalFields: {
			plan: {
				type: "string",
				input: false,
			},
			credits: {
				type: "number",
				input: false,
			},
		},
	},
	trustedOrigins: getTrustedOrigins(),
	logger: {
		level: "warn",
		disableColors: true,
		log(level, message, ...args) {
			const safeMessage = sanitizeSecretText(
				[message, ...args.map(authLogValue)].join(" "),
			);
			if (level === "error") console.error(`[Better Auth] ${safeMessage}`);
			else console.warn(`[Better Auth] ${safeMessage}`);
		},
	},
	session: {
	expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day update age
		// Avoid a Neon round trip on every dashboard render and Zebu tool call.
		// A short cache keeps revocation latency bounded while absorbing cold starts.
		cookieCache: {
			enabled: true,
			maxAge: 60,
			strategy: "compact",
		},
	},
	advanced: {
		useSecureCookies: process.env.NODE_ENV === "production",
	},
	account: {
		storeStateStrategy: "cookie",
		encryptOAuthTokens: true,
		accountLinking: {
			enabled: ACCOUNT_LINKING.enabled,
			disableImplicitLinking: ACCOUNT_LINKING.disableImplicitLinking,
			allowDifferentEmails: ACCOUNT_LINKING.allowDifferentEmails,
			updateUserInfoOnLink: ACCOUNT_LINKING.updateUserInfoOnLink,
			trustedProviders: [...ACCOUNT_LINKING.trustedProviders],
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: isTransactionalEmailConfigured(),
		revokeSessionsOnPasswordReset: true,
		...(isTransactionalEmailConfigured() ? {
			sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
				await sendTransactionalEmail({
					to: user.email,
					subject: "Reset your Zebra AI password",
					text: `Use this link to reset your Zebra AI password:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
				});
			},
		} : {}),
	},
	...(isTransactionalEmailConfigured() ? {
		emailVerification: {
			sendOnSignUp: true,
			sendOnSignIn: true,
			sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
				await sendTransactionalEmail({
					to: user.email,
					subject: "Verify your Zebra AI email",
					text: `Verify your Zebra AI email address with this link:\n\n${url}\n\nIf you did not create an account, you can ignore this email.`,
				});
			},
		},
	} : {}),
	socialProviders: buildSocialProviders(process.env),
});
