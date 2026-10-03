import { NextResponse } from "next/server";
import { withRequestPolicy } from "@/lib/request-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { createInstallState, INSTALL_STATE_COOKIE, INSTALL_STATE_MAX_AGE_SECONDS, readGitHubAppEnv, readStateSecret } from "@/lib/github-app";
import { getLinkedGitHubAccount } from "@/lib/github-install-store";

export const POST = withRequestPolicy({ requireAuth: true, operationName: "github-install-start" }, async (_req, ctx) => {
    const userId = ctx.auth!.user.id;
    const app = readGitHubAppEnv();
    const secret = readStateSecret();
    if (!app || !secret) return NextResponse.json({ error: "GitHub App is not configured." }, { status: 503 });
    const rate = await checkDistributedRateLimit(`github-install:${userId}`, 10, 10 * 60_000);
    if (!rate.success) return NextResponse.json({ error: "Too many installation attempts. Try again later." }, { status: 429 });
    const linked = await getLinkedGitHubAccount(userId);
    if (!linked) return NextResponse.json({ error: "Link GitHub before installing repositories." }, { status: 409 });
    const state = createInstallState(userId, secret);
    const response = NextResponse.json({ url: `https://github.com/apps/${app.slug}/installations/new?state=${encodeURIComponent(state)}` });
    response.cookies.set({
        name: INSTALL_STATE_COOKIE,
        value: state,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: INSTALL_STATE_MAX_AGE_SECONDS,
    });
    return response;
});
