import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./schema";

const getTrustedOrigins = () => {
	const origins: string[] = [];
	if (process.env.BETTER_AUTH_URL) {
		origins.push(process.env.BETTER_AUTH_URL);
	}
	if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
		const parsed = process.env.BETTER_AUTH_TRUSTED_ORIGINS
			.split(",")
			.map((o) => o.trim())
			.filter(Boolean);
		origins.push(...parsed);
	}
	return Array.from(new Set(origins));
};

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	user: {
		additionalFields: {
			plan: {
				type: "string",
			},
			credits: {
				type: "number",
			},
		},
	},
	trustedOrigins: getTrustedOrigins(),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	},
});

