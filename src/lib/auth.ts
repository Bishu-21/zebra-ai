import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, sanitizeSecretText } from "./db";
import * as schema from "./schema";

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

const hasGoogleAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

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
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: hasGoogleAuth ? {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	} : {},
});
