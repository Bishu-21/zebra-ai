import { NextResponse } from "next/server";
import { withRequestPolicy } from "@/lib/request-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { GitHubRequestError, createAppJwt, readGitHubAppEnv } from "@/lib/github-app";
import { deleteAppInstallation } from "@/lib/github-sync";
import { deleteLocalGitHubInstallation, getGitHubInstallStatus, peekGitHubInstallationId } from "@/lib/github-install-store";

export const GET = withRequestPolicy({ requireAuth: true, operationName: "github-install-status" }, async (_req, ctx) => {
    return NextResponse.json(await getGitHubInstallStatus(ctx.auth!.user.id));
});

export const DELETE = withRequestPolicy({ requireAuth: true, operationName: "github-install-remove" }, async (_req, ctx) => {
    const userId = ctx.auth!.user.id;
    const rate = await checkDistributedRateLimit(`github-install-remove:${userId}`, 10, 60 * 60_000);
    if (!rate.success) return NextResponse.json({ error: "Too many removal attempts. Try again later." }, { status: 429 });
    const installationId = await peekGitHubInstallationId(userId);
    if (!installationId) return NextResponse.json(await getGitHubInstallStatus(userId));
    const app = readGitHubAppEnv();
    if (!app) return NextResponse.json({ error: "GitHub App is not configured." }, { status: 503 });
    try {
        await deleteAppInstallation(fetch, createAppJwt(app.appId, app.privateKey), installationId);
    } catch (error) {
        if (!(error instanceof GitHubRequestError)) throw error;
        return NextResponse.json({ error: "GitHub could not remove the installation." }, { status: 502 });
    }
    await deleteLocalGitHubInstallation(userId);
    const status = await getGitHubInstallStatus(userId);
    return NextResponse.json({ ...status, evidenceRetained: status.retainedEvidence });
});
