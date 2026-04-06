import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL || "https://zebra-ai-gamma.vercel.app",
});

export const { signIn, signUp, useSession, signOut } = authClient;
