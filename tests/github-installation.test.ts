import assert from "node:assert/strict";
import { createHmac, createVerify, generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, describe, test } from "node:test";
import { accountLinkErrorMessage } from "../src/lib/account-link-errors";
import {
    README_CHAR_CAP,
    authorizeInstallation,
    createAppJwt,
    createInstallState,
    evidenceFromRepository,
    installStateMatches,
    interpretWebhookEvent,
    parseInstallationPayload,
    readmeSnapshot,
    toAcceptResponse,
    verifyInstallState,
    verifyWebhookSignature,
    webhookRemovesRepositories,
    type RepositorySnapshot,
} from "../src/lib/github-app";
import { syncInstallationRepositories } from "../src/lib/github-sync";
import { upsertEvidenceNode } from "../src/lib/evidence-graph";
import { testStore } from "../src/lib/test-store";

const secret = "x".repeat(32);
const installation = {
    id: 9,
    app_id: 55,
    account: { id: 7, login: "octocat", type: "User" },
    repository_selection: "selected",
    permissions: { contents: "read", metadata: "read" },
    suspended_at: null,
};

function visibleRepo(overrides: Record<string, unknown> = {}) {
    return {
        id: 101,
        name: "visible",
        full_name: "octo/visible",
        private: false,
        default_branch: "main",
        html_url: "https://github.com/octo/visible",
        language: "TypeScript",
        topics: ["zebra"],
        description: "A sample",
        pushed_at: "2026-01-01T00:00:00Z",
        owner: { id: 7, login: "octocat" },
        ...overrides,
    };
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("GitHub installation and evidence", () => {
    after(() => {
        for (const [id, node] of testStore.evidenceNodes) {
            if (node.userId === "github_accept_user") testStore.evidenceNodes.delete(id);
        }
    });

    test("auth return errors stay on the known list", () => {
        assert.match(accountLinkErrorMessage("access_denied", null), /refused/);
        assert.match(accountLinkErrorMessage("unable_to_link_account", null), /could not be linked/);
        assert.equal(accountLinkErrorMessage("not_a_real_code", "also_unknown"), "The account link did not complete.");
        assert.match(accountLinkErrorMessage(null, "bad_state"), /expired/);
    });

    test("install state is bound to the signed-in user and expires", () => {
        const state = createInstallState("user-1", secret);
        assert.equal(installStateMatches(state, state, secret, "user-1"), true);
        assert.equal(installStateMatches(state, state, secret, "user-2"), false);
        assert.equal(installStateMatches(undefined, state, secret, "user-1"), false);
        assert.equal(verifyInstallState(`${state}x`, secret, "user-1"), false);
        const expired = createInstallState("user-1", secret, Date.now() - 700_000);
        assert.equal(verifyInstallState(expired, secret, "user-1"), false);
    });

    test("app JWT is RS256, slightly backdated, and shorter than ten minutes", () => {
        const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
        const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
        const token = createAppJwt("55", pem);
        const [headerPart, payloadPart, signaturePart] = token.split(".");
        const header = JSON.parse(Buffer.from(headerPart, "base64url").toString()) as { alg: string };
        const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString()) as { iss: string; iat: number; exp: number };
        assert.equal(header.alg, "RS256");
        assert.equal(payload.iss, "55");
        assert.ok(payload.iat < Math.floor(Date.now() / 1000));
        assert.equal(payload.exp - payload.iat, 540);
        const verifier = createVerify("RSA-SHA256");
        verifier.update(`${headerPart}.${payloadPart}`);
        verifier.end();
        assert.equal(verifier.verify(publicKey, Buffer.from(signaturePart, "base64url")), true);
    });

    test("installation claim rejects another Zebra user, an id mismatch, a suspension, and extra permissions", () => {
        const parsed = parseInstallationPayload("55", installation);
        assert.equal(parsed.ok, true);
        if (!parsed.ok) return;
        assert.equal(authorizeInstallation({
            claim: parsed.claim,
            linkedAccountId: "7",
            linkedUserCanAccess: false,
            existingOwnerUserId: "other-user",
            zebraUserId: "user-1",
        }).ok, false);
        const mismatch = authorizeInstallation({
            claim: parsed.claim,
            linkedAccountId: "8",
            linkedUserCanAccess: true,
            existingOwnerUserId: null,
            zebraUserId: "user-1",
        });
        assert.equal(mismatch.ok, false);
        if (!mismatch.ok) assert.equal(mismatch.error, "user_mismatch");
        const suspended = parseInstallationPayload("55", { ...installation, suspended_at: "2026-01-01T00:00:00Z" });
        assert.equal(suspended.ok, false);
        if (!suspended.ok) assert.equal(suspended.error, "suspended");
        const permissions = parseInstallationPayload("55", { ...installation, permissions: { contents: "read", administration: "read" } });
        assert.equal(permissions.ok, false);
        if (!permissions.ok) assert.equal(permissions.error, "permissions");
        const org = parseInstallationPayload("55", { ...installation, account: { id: 42, login: "acme", type: "Organization" } });
        assert.equal(org.ok, true);
        if (!org.ok) return;
        const orgAccess = authorizeInstallation({
            claim: org.claim,
            linkedAccountId: "7",
            linkedUserCanAccess: false,
            existingOwnerUserId: null,
            zebraUserId: "user-1",
        });
        assert.equal(orgAccess.ok, false);
        if (!orgAccess.ok) assert.equal(orgAccess.error, "org_not_accessible");
    });

    test("webhook signature mismatch fails and installation.deleted removes repository rows", () => {
        const body = Buffer.from(JSON.stringify({ action: "deleted", installation: { id: 9 } }));
        const signature = `sha256=${createHmac("sha256", "hook-secret").update(body).digest("hex")}`;
        assert.equal(verifyWebhookSignature(body, "sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "hook-secret"), false);
        assert.equal(verifyWebhookSignature(body, signature, "hook-secret"), true);
        const effect = interpretWebhookEvent("installation", JSON.parse(body.toString("utf8")));
        assert.equal(effect.op, "suspend");
        assert.equal(webhookRemovesRepositories(effect), true);
        const store = readFileSync(new URL("../src/lib/github-install-store.ts", import.meta.url), "utf8");
        assert.match(store, /effect\.op === "suspend"/);
        assert.match(store, /removedAt: now/);
        const migration = readFileSync(new URL("../drizzle/0014_github_installations.sql", import.meta.url), "utf8");
        assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
        assert.match(migration, /FORCE ROW LEVEL SECURITY/);
        assert.match(migration, /current_setting\('app\.user_id', true\)/);
        assert.match(migration, /WITH CHECK/);
    });

    test("a repository absent from the installation list is never requested", async () => {
        const calls: string[] = [];
        const result = await syncInstallationRepositories({
            appJwt: "jwt",
            installationId: "9",
            expectedAppId: "55",
            linked: { accountId: "7", login: "octocat" },
            onRequest: (url) => calls.push(url),
            fetchImpl: async (url, init) => {
                calls.push(`${init?.method || "GET"} ${url}`);
                if (url.includes("hidden")) throw new Error("absent repository was requested");
                if (url.endsWith("/access_tokens")) return json({ token: "installation-token" });
                if (url.endsWith("/app/installations/9")) return json(installation);
                if (url.includes("/installation/repositories")) return json({ repositories: [visibleRepo()] });
                if (url.endsWith("/readme")) return json({ content: Buffer.from("hello readme").toString("base64"), encoding: "base64" });
                throw new Error(`unexpected ${url}`);
            },
        });
        assert.equal(calls.some((call) => call.includes("hidden") || call.includes("/repos/octo/visible") && !call.includes("/readme")), false);
        assert.equal(result.snapshots[0]?.authorship, "owner");
        assert.equal(result.snapshots[0]?.readmeExcerpt, "hello readme");
        assert.equal(result.snapshots[0]?.readmeSha256?.length, 64);
    });

    test("unconfirmed authorship does not become evidence and accept is idempotent without README text", async () => {
        const calls: string[] = [];
        const result = await syncInstallationRepositories({
            appJwt: "jwt",
            installationId: "9",
            expectedAppId: "55",
            linked: { accountId: "7", login: "octocat" },
            fetchImpl: async (url, init) => {
                calls.push(`${init?.method || "GET"} ${url}`);
                if (url.endsWith("/access_tokens")) return json({ token: "installation-token" });
                if (url.endsWith("/app/installations/9")) return json(installation);
                if (url.includes("/installation/repositories")) return json({ repositories: [visibleRepo({ owner: { id: 99, login: "someone" } })] });
                if (url.endsWith("/readme")) return json({ content: Buffer.from("SUPER_SECRET_README_BODY").toString("base64"), encoding: "base64" });
                if (url.includes("/commits")) return json([{ author: { id: 3 } }]);
                throw new Error(`unexpected ${url}`);
            },
        });
        assert.equal(result.snapshots[0]?.authorship, "not_confirmed");
        assert.equal(evidenceFromRepository("github_accept_user", result.snapshots[0] as RepositorySnapshot), null);
        assert.equal(calls.some((call) => call.includes("/commits")), true);

        const secretText = "SUPER_SECRET_README_BODY";
        const confirmed: RepositorySnapshot = {
            ...(result.snapshots[0] as RepositorySnapshot),
            authorship: "owner",
            readmeExcerpt: secretText,
        };
        assert.equal(evidenceFromRepository("github_accept_user", { ...confirmed, language: null }), null);
        const draft = evidenceFromRepository("github_accept_user", confirmed);
        assert.ok(draft);
        assert.equal(draft?.source, "git");
        assert.equal(draft?.confidence, "imported");
        const payload = JSON.stringify(toAcceptResponse(draft ? [draft] : []));
        assert.equal(payload.includes(secretText), false);
        assert.equal(payload.includes("readme"), false);
        process.env.TEST_AUTH_USER_ID = "github_accept_user";
        const first = await upsertEvidenceNode("github_accept_user", draft!);
        const second = await upsertEvidenceNode("github_accept_user", draft!);
        assert.equal(first.id, second.id);
        assert.equal([...testStore.evidenceNodes.values()].filter((node) => node.userId === "github_accept_user").length, 1);

        const capped = readmeSnapshot("y".repeat(README_CHAR_CAP));
        assert.equal(capped.sha256, readmeSnapshot(`${"y".repeat(README_CHAR_CAP)}extra`).sha256);
        assert.equal(readmeSnapshot("z".repeat(500)).excerpt.length, 240);
    });

    test("settings keep install disabled until the account is linked and the App is configured", () => {
        const ui = readFileSync(new URL("../src/components/dashboard/ConnectedAccounts.tsx", import.meta.url), "utf8");
        assert.match(ui, /Repository access requires a separate GitHub App installation/);
        assert.match(ui, /A link is not repository access/);
        assert.match(ui, /disabled=\{busy !== null \|\| !githubLinked \|\| !githubAppConfigured\}/);
        const syncSource = readFileSync(new URL("../src/lib/github-sync.ts", import.meta.url), "utf8");
        const acceptSource = readFileSync(new URL("../src/app/api/github/accept/route.ts", import.meta.url), "utf8");
        assert.doesNotMatch(`${syncSource}\n${acceptSource}`, /openai|azure-foundry|project-analyse|generateText/);
        const analyser = readFileSync(new URL("../src/app/api/ai/project-analyse/route.ts", import.meta.url), "utf8");
        assert.match(analyser, /api\.github\.com\/repos/);
        assert.doesNotMatch(analyser, /access_tokens|GITHUB_APP_PRIVATE_KEY/);
    });
});
