import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { getAuthBaseURL } from "@/lib/auth";
import {
    GitHubRequestError,
    INSTALL_STATE_COOKIE,
    authorizeInstallation,
    createAppJwt,
    decryptStoredOAuthToken,
    installStateMatches,
    parseInstallationPayload,
    readGitHubAppEnv,
    readStateSecret,
} from "@/lib/github-app";
import { fetchAppInstallation, linkedUserCanAccessInstallation } from "@/lib/github-sync";
import { findInstallationOwner, getLinkedGitHubAccount, saveGitHubInstallation } from "@/lib/github-install-store";

function finish(code?: string) {
    const url = new URL("/dashboard/settings", getAuthBaseURL());
    url.searchParams.set("tab", "account");
    if (code) url.searchParams.set("github_error", code);
    const response = NextResponse.redirect(url);
    response.cookies.set({ name: INSTALL_STATE_COOKIE, value: "", path: "/", maxAge: 0 });
    return response;
}

export async function GET(request: Request) {
    const app = readGitHubAppEnv();
    const secret = readStateSecret();
    if (!app || !secret) return finish("bad_state");
    const { auth, errorResponse } = await requireAuth();
    if (errorResponse || !auth) return NextResponse.redirect(new URL("/signin", getAuthBaseURL()));
    const incoming = new URL(request.url);
    const jar = await cookies();
    if (!installStateMatches(jar.get(INSTALL_STATE_COOKIE)?.value, incoming.searchParams.get("state"), secret, auth.user.id)) {
        return finish("bad_state");
    }
    const installationId = incoming.searchParams.get("installation_id") || "";
    if (!/^\d{1,20}$/.test(installationId)) return finish("missing_installation");
    try {
        const payload = await fetchAppInstallation(fetch, createAppJwt(app.appId, app.privateKey), installationId);
        const parsed = parseInstallationPayload(app.appId, payload);
        if (!parsed.ok) return finish(parsed.error);
        const linked = await getLinkedGitHubAccount(auth.user.id);
        if (!linked) return finish("user_mismatch");
        let linkedUserCanAccess = false;
        if (parsed.claim.accountType === "Organization") {
            try {
                if (!linked.accessToken) return finish("org_not_accessible");
                const userToken = await decryptStoredOAuthToken(linked.accessToken, secret);
                linkedUserCanAccess = await linkedUserCanAccessInstallation(fetch, userToken, installationId);
            } catch (error) {
                if (error instanceof GitHubRequestError && error.status >= 500) throw error;
                return finish("org_not_accessible");
            }
        }
        const decision = authorizeInstallation({
            claim: parsed.claim,
            linkedAccountId: linked.accountId,
            linkedUserCanAccess,
            existingOwnerUserId: await findInstallationOwner(installationId),
            zebraUserId: auth.user.id,
        });
        if (!decision.ok) return finish(decision.error);
        await saveGitHubInstallation(auth.user.id, parsed.claim);
        return finish();
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (/duplicate key|unique constraint/i.test(message)) return finish("owned_by_other");
        if (error instanceof GitHubRequestError && (error.status === 404 || error.status === 401)) return finish("wrong_app");
        console.error("GitHub installation callback failed", error instanceof GitHubRequestError ? error.path : "unavailable");
        return finish("wrong_app");
    }
}
