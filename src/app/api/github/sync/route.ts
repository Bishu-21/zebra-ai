import { NextResponse } from "next/server";
import { withRequestPolicy } from "@/lib/request-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { createAppJwt, decryptStoredOAuthToken, readGitHubAppEnv, readStateSecret } from "@/lib/github-app";
import { fetchLinkedGitHubIdentity, syncInstallationRepositories } from "@/lib/github-sync";
import { completeSyncRun, failSyncRun, getGitHubInstallStatus, getLinkedGitHubAccount, markInstallationSuspended, openSyncRun } from "@/lib/github-install-store";

const KNOWN = new Set(["permissions", "suspended", "wrong_app", "user_mismatch"]);

export const POST = withRequestPolicy({ requireAuth: true, operationName: "github-sync" }, async (_req, ctx) => {
    const userId = ctx.auth!.user.id;
    const app = readGitHubAppEnv();
    const secret = readStateSecret();
    if (!app || !secret) return NextResponse.json({ error: "GitHub App is not configured." }, { status: 503 });
    const rate = await checkDistributedRateLimit(`github-sync:${userId}`, 6, 60 * 60_000);
    if (!rate.success) return NextResponse.json({ error: "Sync is rate limited. Try again later." }, { status: 429 });
    const linked = await getLinkedGitHubAccount(userId);
    if (!linked) return NextResponse.json({ error: "Link GitHub before syncing repositories." }, { status: 409 });
    const opened = await openSyncRun(userId);
    if ("error" in opened) return NextResponse.json({ error: opened.error }, { status: opened.error === "suspended" ? 409 : 404 });
    try {
        let login = "";
        if (linked.accessToken) {
            try {
                const identity = await fetchLinkedGitHubIdentity(fetch, await decryptStoredOAuthToken(linked.accessToken, secret));
                if (identity.accountId !== linked.accountId) {
                    await failSyncRun(userId, opened.runId, "user_mismatch");
                    return NextResponse.json({ error: "The linked GitHub account no longer matches." }, { status: 409 });
                }
                login = identity.login;
            } catch {
                login = "";
            }
        }
        const result = await syncInstallationRepositories({
            fetchImpl: fetch,
            appJwt: createAppJwt(app.appId, app.privateKey),
            installationId: opened.installationId,
            expectedAppId: app.appId,
            linked: { accountId: linked.accountId, login },
        });
        await completeSyncRun(userId, opened.runId, opened.localId, result.claim, result.snapshots);
        return NextResponse.json(await getGitHubInstallStatus(userId));
    } catch (error) {
        const code = error instanceof Error && KNOWN.has(error.message) ? error.message : "github_api";
        if (code === "suspended") await markInstallationSuspended(userId);
        await failSyncRun(userId, opened.runId, code);
        return NextResponse.json({ error: "GitHub sync failed.", errorCode: code }, { status: 502 });
    }
});
