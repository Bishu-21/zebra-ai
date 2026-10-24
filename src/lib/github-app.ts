import { createHash, createHmac, createSign, randomBytes, timingSafeEqual } from "node:crypto";
import { parseEnvelope, symmetricDecrypt, type SecretConfig } from "better-auth/crypto";

export const GITHUB_API = "https://api.github.com";
export const INSTALL_STATE_COOKIE = "zebra_github_install";
export const INSTALL_STATE_MAX_AGE_SECONDS = 600;
export const README_CHAR_CAP = 100_000;
export const README_EXCERPT_CHARS = 240;

const ALLOWED_PERMISSIONS = new Set(["metadata", "contents"]);

export class GitHubRequestError extends Error {
    constructor(readonly status: number, readonly path: string) {
        super(`GitHub API ${status} ${path}`);
    }
}

export type InstallationError =
    | "wrong_app"
    | "suspended"
    | "permissions"
    | "selection"
    | "account_type"
    | "owned_by_other"
    | "user_mismatch"
    | "org_not_accessible";

export interface InstallationClaim {
    installationId: string;
    accountLogin: string;
    accountId: string;
    accountType: "User" | "Organization";
    repositorySelection: "selected" | "all";
    permissions: Record<string, string>;
    suspendedAt: string | null;
}

export type Authorship = "owner" | "commit_author" | "not_confirmed";

export interface RepositorySnapshot {
    repoId: string;
    fullName: string;
    name: string;
    private: boolean;
    defaultBranch: string | null;
    htmlUrl: string | null;
    language: string | null;
    topics: string[];
    description: string | null;
    pushedAt: string | null;
    authorship: Authorship;
    readmeSha256: string | null;
    readmeExcerpt: string | null;
}

export interface GitEvidenceDraft {
    id: string;
    companyOrProject: string;
    skill: string;
    action: string;
    measurableOutcome: string;
    proofUrl: string | null;
    confidence: "imported";
    source: "git";
}

export type WebhookEffect =
    | { op: "ignore" }
    | { op: "suspend"; installationId: string }
    | { op: "unsuspend"; installationId: string }
    | {
        op: "repositories";
        installationId: string;
        added: Array<{ repoId: string; fullName: string; private: boolean }>;
        removedRepoIds: string[];
    };

export function normalizePem(value: string): string {
    const trimmed = value.trim().replace(/^["']|["']$/g, "");
    return trimmed.includes("\\n") ? trimmed.replace(/\\n/g, "\n") : trimmed;
}

export function assertGitHubInstallationId(value: string): string {
    if (!/^\d{1,20}$/.test(value)) throw new GitHubRequestError(400, "/app/installations");
    return value;
}

export function parseRepositoryFullName(fullName: string): { owner: string; repo: string } | null {
    const parts = fullName.split("/");
    if (parts.length !== 2) return null;
    const [owner, repo] = parts;
    if (!owner || !repo || owner === "." || owner === ".." || repo === "." || repo === "..") return null;
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
    return { owner, repo };
}

export function githubHtmlUrl(value: unknown): string | null {
    if (typeof value !== "string") return null;
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" || url.hostname !== "github.com") return null;
        return url.toString();
    } catch {
        return null;
    }
}

/** RS256 App JWT. `iat` is slightly in the past and lifetime stays under 10 minutes. */
export function createAppJwt(appId: string, privateKeyPem: string, nowMs = Date.now()): string {
    const iat = Math.floor(nowMs / 1000) - 60;
    const exp = iat + 9 * 60;
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ iat, exp, iss: appId })).toString("base64url");
    const data = `${header}.${payload}`;
    const signer = createSign("RSA-SHA256");
    signer.update(data);
    signer.end();
    return `${data}.${signer.sign(normalizePem(privateKeyPem)).toString("base64url")}`;
}

export function verifyWebhookSignature(rawBody: Buffer, header: string | null, secret: string): boolean {
    if (!header || !secret) return false;
    const match = /^sha256=([0-9a-f]{64})$/i.exec(header.trim());
    if (!match) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest();
    const received = Buffer.from(match[1], "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
}

export function createInstallState(userId: string, secret: string, nowMs = Date.now()): string {
    if (!secret) throw new Error("Missing state secret.");
    const payload = Buffer.from(JSON.stringify({
        userId,
        exp: nowMs + INSTALL_STATE_MAX_AGE_SECONDS * 1000,
        nonce: randomBytes(16).toString("base64url"),
    })).toString("base64url");
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

export function verifyInstallState(state: string, secret: string, userId: string, nowMs = Date.now()): boolean {
    const separator = state.lastIndexOf(".");
    if (separator <= 0 || !secret) return false;
    const payload = state.slice(0, separator);
    const signature = state.slice(separator + 1);
    const expected = createHmac("sha256", secret).update(payload).digest("base64url");
    const received = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (received.length !== expectedBuf.length || !timingSafeEqual(received, expectedBuf)) return false;
    try {
        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string; exp?: number };
        return parsed.userId === userId && typeof parsed.exp === "number" && parsed.exp > nowMs;
    } catch {
        return false;
    }
}

export function installStateMatches(cookieValue: string | undefined, queryState: string | null, secret: string, userId: string, nowMs = Date.now()): boolean {
    if (!cookieValue || !queryState || cookieValue.length !== queryState.length) return false;
    const left = Buffer.from(cookieValue);
    const right = Buffer.from(queryState);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
    return verifyInstallState(cookieValue, secret, userId, nowMs);
}

export function permissionsAreContentsRead(permissions: Record<string, string>): boolean {
    const entries = Object.entries(permissions);
    if (permissions.contents !== "read") return false;
    return entries.every(([key, value]) => ALLOWED_PERMISSIONS.has(key) && value === "read");
}

export function parseInstallationPayload(expectedAppId: string, payload: unknown): { ok: true; claim: InstallationClaim } | { ok: false; error: InstallationError } {
    if (!payload || typeof payload !== "object") return { ok: false, error: "wrong_app" };
    const body = payload as Record<string, unknown>;
    const account = body.account as Record<string, unknown> | undefined;
    if (String(body.app_id ?? "") !== expectedAppId) return { ok: false, error: "wrong_app" };
    if (body.suspended_at || body.suspended_by) return { ok: false, error: "suspended" };
    const installationId = String(body.id ?? "");
    if (!/^\d{1,20}$/.test(installationId)) return { ok: false, error: "wrong_app" };
    const accountType = account?.type;
    if (accountType !== "User" && accountType !== "Organization") return { ok: false, error: "account_type" };
    const accountId = String(account?.id ?? "");
    const accountLogin = typeof account?.login === "string" ? account.login : "";
    if (!/^\d{1,20}$/.test(accountId) || !accountLogin) return { ok: false, error: "account_type" };
    const selection = body.repository_selection;
    if (selection !== "selected" && selection !== "all") return { ok: false, error: "selection" };
    const permissions = body.permissions;
    if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) return { ok: false, error: "permissions" };
    const permissionRecord = Object.fromEntries(Object.entries(permissions as Record<string, unknown>).map(([key, value]) => [key, String(value)]));
    if (!permissionsAreContentsRead(permissionRecord)) return { ok: false, error: "permissions" };
    return {
        ok: true,
        claim: {
            installationId,
            accountLogin,
            accountId,
            accountType,
            repositorySelection: selection,
            permissions: permissionRecord,
            suspendedAt: null,
        },
    };
}

export function authorizeInstallation(input: {
    claim: InstallationClaim;
    linkedAccountId: string;
    linkedUserCanAccess: boolean;
    existingOwnerUserId: string | null;
    zebraUserId: string;
}): { ok: true } | { ok: false; error: InstallationError } {
    if (input.existingOwnerUserId && input.existingOwnerUserId !== input.zebraUserId) {
        return { ok: false, error: "owned_by_other" };
    }
    if (input.claim.accountType === "User" && input.claim.accountId !== input.linkedAccountId) {
        return { ok: false, error: "user_mismatch" };
    }
    if (input.claim.accountType === "Organization" && !input.linkedUserCanAccess) {
        return { ok: false, error: "org_not_accessible" };
    }
    return { ok: true };
}

export async function decryptStoredOAuthToken(token: string, secret: string): Promise<string> {
    if (!token) throw new Error("Missing OAuth token.");
    if (token.startsWith("$ba$")) {
        const envelope = parseEnvelope(token);
        if (!envelope) throw new Error("Unreadable OAuth token.");
        const key: SecretConfig = { keys: new Map([[envelope.version, secret]]), currentVersion: envelope.version, legacySecret: secret };
        return symmetricDecrypt({ key, data: token });
    }
    if (token.length % 2 === 0 && /^[0-9a-f]+$/i.test(token)) {
        return symmetricDecrypt({ key: secret, data: token });
    }
    return token;
}

export function readmeSnapshot(decoded: string): { sha256: string; excerpt: string } {
    const capped = decoded.slice(0, README_CHAR_CAP);
    const excerpt = capped.replace(/\s+/g, " ").trim().slice(0, README_EXCERPT_CHARS);
    return { sha256: createHash("sha256").update(capped).digest("hex"), excerpt };
}

export function isRepositoryOwner(owner: { id: number | string; login: string }, linked: { accountId: string; login: string }): boolean {
    if (String(owner.id) === linked.accountId) return true;
    return Boolean(linked.login) && owner.login.toLowerCase() === linked.login.toLowerCase();
}

export function commitAuthorMatches(authorIds: Array<number | string | null | undefined>, accountId: string): boolean {
    return authorIds.some((id) => id != null && String(id) === accountId);
}

export function authorshipFor(ownerMatch: boolean, commitMatch: boolean): Authorship {
    if (ownerMatch) return "owner";
    if (commitMatch) return "commit_author";
    return "not_confirmed";
}

export function gitEvidenceId(userId: string, repoId: string): string {
    const digest = createHash("sha256").update(`${userId}\0${repoId}`).digest("hex").slice(0, 32);
    return `ev_git_${digest}`;
}

/** Confirmed authorship plus a real GitHub language. A visible repository is not personal evidence by itself. */
export function evidenceFromRepository(userId: string, repo: Pick<RepositorySnapshot, "repoId" | "name" | "fullName" | "language" | "description" | "htmlUrl" | "authorship">): GitEvidenceDraft | null {
    if (repo.authorship === "not_confirmed" || !repo.language?.trim()) return null;
    const description = repo.description?.trim();
    const action = description || (repo.authorship === "owner"
        ? `Owns the GitHub repository ${repo.fullName}.`
        : `Commit author on the default branch of ${repo.fullName}.`);
    return {
        id: gitEvidenceId(userId, repo.repoId),
        companyOrProject: repo.name,
        skill: repo.language.trim(),
        action,
        measurableOutcome: "",
        proofUrl: repo.htmlUrl,
        confidence: "imported",
        source: "git",
    };
}

export function toAcceptResponse(nodes: GitEvidenceDraft[]) {
    return {
        evidenceNodes: nodes.map((node) => ({
            id: node.id,
            companyOrProject: node.companyOrProject,
            skill: node.skill,
            action: node.action,
            measurableOutcome: node.measurableOutcome,
            proofUrl: node.proofUrl,
            confidence: node.confidence,
            source: node.source,
        })),
    };
}

function repositoryRef(value: unknown): { repoId: string; fullName: string; private: boolean } | null {
    if (!value || typeof value !== "object") return null;
    const repo = value as Record<string, unknown>;
    const repoId = String(repo.id ?? "");
    const fullName = typeof repo.full_name === "string" ? repo.full_name : "";
    if (!/^\d{1,20}$/.test(repoId) || !parseRepositoryFullName(fullName)) return null;
    return { repoId, fullName, private: repo.private === true };
}

export function interpretWebhookEvent(event: string | null, payload: unknown): WebhookEffect {
    if (!payload || typeof payload !== "object") return { op: "ignore" };
    const body = payload as Record<string, unknown>;
    const installation = body.installation as Record<string, unknown> | undefined;
    const installationId = String(installation?.id ?? "");
    if (!/^\d{1,20}$/.test(installationId)) return { op: "ignore" };
    if (event === "installation" && (body.action === "deleted" || body.action === "suspend")) {
        return { op: "suspend", installationId };
    }
    if (event === "installation" && body.action === "unsuspend") {
        return { op: "unsuspend", installationId };
    }
    if (event === "installation_repositories" && (body.action === "added" || body.action === "removed")) {
        const added = Array.isArray(body.repositories_added) ? body.repositories_added.map(repositoryRef).filter((repo) => repo !== null) : [];
        const removed = Array.isArray(body.repositories_removed) ? body.repositories_removed.map(repositoryRef).filter((repo) => repo !== null) : [];
        return { op: "repositories", installationId, added, removedRepoIds: removed.map((repo) => repo.repoId) };
    }
    return { op: "ignore" };
}

export function webhookRemovesRepositories(effect: WebhookEffect): boolean {
    return effect.op === "suspend";
}

export function readGitHubAppEnv(env: Record<string, string | undefined> = process.env): { appId: string; privateKey: string; slug: string; webhookSecret: string } | null {
    const appId = env.GITHUB_APP_ID;
    const privateKey = env.GITHUB_APP_PRIVATE_KEY;
    const slug = env.GITHUB_APP_SLUG;
    const webhookSecret = env.GITHUB_WEBHOOK_SECRET;
    if (!appId || !privateKey || !slug || !webhookSecret) return null;
    if (!/^\d{1,20}$/.test(appId) || !/^[A-Za-z0-9-]+$/.test(slug)) return null;
    return { appId, privateKey, slug, webhookSecret };
}

export function readStateSecret(env: Record<string, string | undefined> = process.env): string | null {
    const secret = env.BETTER_AUTH_SECRET;
    return secret && secret.length >= 16 ? secret : null;
}
