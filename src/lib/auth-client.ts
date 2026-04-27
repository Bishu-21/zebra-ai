import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: typeof window !== "undefined" ? undefined : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
});

export const { signIn, signUp, useSession, signOut } = authClient;
