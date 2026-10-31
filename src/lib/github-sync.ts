import { z } from "zod";
import {
    GITHUB_API,
    GitHubRequestError,
    assertGitHubInstallationId,
    authorshipFor,
    commitAuthorMatches,
    githubHtmlUrl,
    isRepositoryOwner,
    parseInstallationPayload,
    parseRepositoryFullName,
    readmeSnapshot,
    type InstallationClaim,
    type RepositorySnapshot,
} from "@/lib/github-app";

const tokenSchema = z.object({ token: z.string().min(1) });
const userSchema = z.object({ id: z.number().int().positive(), login: z.string().min(1) });
const ownerSchema = z.object({ id: z.number().int(), login: z.string() });
const repoSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    full_name: z.string().min(1),
    private: z.boolean(),
    default_branch: z.string().nullable().optional(),
    html_url: z.string().optional(),
    language: z.string().nullable().optional(),
    topics: z.array(z.string()).optional(),
    description: z.string().nullable().optional(),
    pushed_at: z.string().nullable().optional(),
    owner: ownerSchema,
});
const listSchema = z.object({ repositories: z.array(repoSchema) });
const readmeSchema = z.object({ content: z.string(), encoding: z.literal("base64") });
const commitSchema = z.array(z.object({ author: z.object({ id: z.number().int() }).nullable().optional() }));

type FetchImpl = (input: string, init: RequestInit) => Promise<Response>;

const apiHeaders = (authorization: string) => ({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "zebra-ai",
    Authorization: authorization,
});

async function readJson(response: Response, path: string): Promise<unknown> {
    if (!response.ok) throw new GitHubRequestError(response.status, path);
    try {
        return await response.json();
    } catch {
        throw new GitHubRequestError(response.status, path);
    }
}

function pathOf(url: string): string {
    const parsed = new URL(url);
    if (parsed.origin !== GITHUB_API) throw new GitHubRequestError(400, parsed.pathname);
    return parsed.pathname;
}

async function mintInstallationToken(fetchImpl: FetchImpl, appJwt: string, installationId: string, body: Record<string, unknown>): Promise<string> {
    const url = `${GITHUB_API}/app/installations/${assertGitHubInstallationId(installationId)}/access_tokens`;
    const response = await fetchImpl(url, {
        method: "POST",
        headers: { ...apiHeaders(`Bearer ${appJwt}`), "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
    });
    const parsed = tokenSchema.safeParse(await readJson(response, pathOf(url)));
    if (!parsed.success) throw new GitHubRequestError(response.status, pathOf(url));
    return parsed.data.token;
}

export async function fetchAppInstallation(fetchImpl: FetchImpl, appJwt: string, installationId: string): Promise<unknown> {
    const url = `${GITHUB_API}/app/installations/${assertGitHubInstallationId(installationId)}`;
    const response = await fetchImpl(url, { headers: apiHeaders(`Bearer ${appJwt}`), signal: AbortSignal.timeout(15_000) });
    return readJson(response, pathOf(url));
}

/** User token is used only to prove the linked account can access an organization installation. */
export async function linkedUserCanAccessInstallation(fetchImpl: FetchImpl, userToken: string, installationId: string): Promise<boolean> {
    const url = `${GITHUB_API}/user/installations/${assertGitHubInstallationId(installationId)}`;
    const response = await fetchImpl(url, { headers: apiHeaders(`Bearer ${userToken}`), signal: AbortSignal.timeout(15_000) });
    if (response.status === 404) return false;
    await readJson(response, pathOf(url));
    return true;
}

export async function deleteAppInstallation(fetchImpl: FetchImpl, appJwt: string, installationId: string): Promise<void> {
    const url = `${GITHUB_API}/app/installations/${assertGitHubInstallationId(installationId)}`;
    const response = await fetchImpl(url, { method: "DELETE", headers: apiHeaders(`Bearer ${appJwt}`), signal: AbortSignal.timeout(15_000) });
    if (response.status === 204 || response.status === 404) return;
    throw new GitHubRequestError(response.status, pathOf(url));
}

export async function fetchLinkedGitHubIdentity(fetchImpl: FetchImpl, userToken: string): Promise<{ accountId: string; login: string }> {
    const url = `${GITHUB_API}/user`;
    const response = await fetchImpl(url, { headers: apiHeaders(`Bearer ${userToken}`), signal: AbortSignal.timeout(15_000) });
    const parsed = userSchema.safeParse(await readJson(response, pathOf(url)));
    if (!parsed.success) throw new GitHubRequestError(response.status, "/user");
    return { accountId: String(parsed.data.id), login: parsed.data.login };
}

function needsDetail(repo: z.infer<typeof repoSchema>): boolean {
    return repo.private || repo.language == null || repo.description == null || !repo.topics;
}

async function listInstallationRepositories(fetchImpl: FetchImpl, token: string, onRequest: (url: string) => void): Promise<Array<z.infer<typeof repoSchema>>> {
    const repositories: Array<z.infer<typeof repoSchema>> = [];
    let next: string | null = `${GITHUB_API}/installation/repositories?per_page=100`;
    for (let page = 0; page < 20 && next; page += 1) {
        const url = next;
        onRequest(url);
        const response = await fetchImpl(url, { headers: apiHeaders(`Bearer ${token}`), signal: AbortSignal.timeout(15_000) });
        const parsed = listSchema.safeParse(await readJson(response, pathOf(url)));
        if (!parsed.success) throw new GitHubRequestError(response.status, pathOf(url));
        repositories.push(...parsed.data.repositories);
        next = null;
        const link = response.headers.get("link");
        const match = link?.match(/<([^>]+)>;\s*rel="next"/);
        if (match) {
            const candidate = new URL(match[1]);
            if (candidate.origin === GITHUB_API && candidate.pathname === "/installation/repositories") next = candidate.toString();
        }
    }
    return repositories;
}

function listedOrThrow(fullName: string, allowed: Set<string>) {
    if (!allowed.has(fullName)) throw new Error("Refusing to read a repository outside the installation list.");
}

/**
 * Reads only repositories returned by the installation list.
 * The installation token stays in this function and is never returned or logged.
 */
export async function syncInstallationRepositories(options: {
    fetchImpl: FetchImpl;
    appJwt: string;
    installationId: string;
    expectedAppId: string;
    linked: { accountId: string; login: string };
    onRequest?: (url: string) => void;
}): Promise<{ claim: InstallationClaim; snapshots: RepositorySnapshot[] }> {
    const onRequest = options.onRequest ?? (() => undefined);
    const installation = await fetchAppInstallation(options.fetchImpl, options.appJwt, options.installationId);
    const parsed = parseInstallationPayload(options.expectedAppId, installation);
    if (!parsed.ok) throw new Error(parsed.error);
    const listToken = await mintInstallationToken(options.fetchImpl, options.appJwt, options.installationId, {
        permissions: { metadata: "read" },
    });
    const listed = (await listInstallationRepositories(options.fetchImpl, listToken, onRequest))
        .filter((repo) => parseRepositoryFullName(repo.full_name));
    const allowed = new Set(listed.map((repo) => repo.full_name));
    const contentTokens = new Map<string, string>();
    for (let index = 0; index < listed.length; index += 100) {
        const chunk = listed.slice(index, index + 100);
        const token = await mintInstallationToken(options.fetchImpl, options.appJwt, options.installationId, {
            permissions: { contents: "read", metadata: "read" },
            repositories: chunk.map((repo) => repo.name),
        });
        for (const repo of chunk) contentTokens.set(repo.full_name, token);
    }
    const snapshots: RepositorySnapshot[] = [];
    for (const repo of listed) {
        const names = parseRepositoryFullName(repo.full_name);
        if (!names) continue;
        listedOrThrow(repo.full_name, allowed);
        const contentToken = contentTokens.get(repo.full_name);
        if (!contentToken) throw new Error("Refusing to read a repository outside the installation list.");
        let detail = repo;
        if (needsDetail(repo)) {
            const url = `${GITHUB_API}/repos/${encodeURIComponent(names.owner)}/${encodeURIComponent(names.repo)}`;
            onRequest(url);
            const response = await options.fetchImpl(url, { headers: apiHeaders(`Bearer ${contentToken}`), signal: AbortSignal.timeout(15_000) });
            const parsedDetail = repoSchema.safeParse(await readJson(response, pathOf(url)));
            if (!parsedDetail.success) throw new GitHubRequestError(response.status, pathOf(url));
            if (!allowed.has(parsedDetail.data.full_name)) throw new Error("Refusing to read a repository outside the installation list.");
            detail = parsedDetail.data;
        }
        const readmeUrl = `${GITHUB_API}/repos/${encodeURIComponent(names.owner)}/${encodeURIComponent(names.repo)}/readme`;
        onRequest(readmeUrl);
        const readmeResponse = await options.fetchImpl(readmeUrl, { headers: apiHeaders(`Bearer ${contentToken}`), signal: AbortSignal.timeout(15_000) });
        let readme: { sha256: string; excerpt: string } | null = null;
        if (readmeResponse.ok) {
            const parsedReadme = readmeSchema.safeParse(await readmeResponse.json());
            if (parsedReadme.success) {
                const decoded = Buffer.from(parsedReadme.data.content.replace(/\s/g, ""), "base64").toString("utf8");
                readme = readmeSnapshot(decoded);
            }
        } else if (readmeResponse.status !== 404) {
            throw new GitHubRequestError(readmeResponse.status, pathOf(readmeUrl));
        }
        const ownerMatch = isRepositoryOwner(detail.owner, options.linked);
        let commitMatch = false;
        if (!ownerMatch && options.linked.accountId) {
            const branch = detail.default_branch || "HEAD";
            const authorQuery = options.linked.login ? `&author=${encodeURIComponent(options.linked.login)}` : "";
            const commitUrl = `${GITHUB_API}/repos/${encodeURIComponent(names.owner)}/${encodeURIComponent(names.repo)}/commits?sha=${encodeURIComponent(branch)}&per_page=100${authorQuery}`;
            onRequest(commitUrl);
            const commitResponse = await options.fetchImpl(commitUrl, { headers: apiHeaders(`Bearer ${contentToken}`), signal: AbortSignal.timeout(15_000) });
            if (commitResponse.ok) {
                const commits = commitSchema.safeParse(await commitResponse.json());
                commitMatch = commits.success && commitAuthorMatches(commits.data.map((commit) => commit.author?.id), options.linked.accountId);
            } else if (commitResponse.status !== 409 && commitResponse.status !== 404) {
                throw new GitHubRequestError(commitResponse.status, pathOf(commitUrl));
            }
        }
        snapshots.push({
            repoId: String(detail.id),
            fullName: detail.full_name,
            name: detail.name,
            private: detail.private,
            defaultBranch: detail.default_branch ?? null,
            htmlUrl: githubHtmlUrl(detail.html_url),
            language: detail.language ?? null,
            topics: (detail.topics ?? []).slice(0, 20).map((topic) => topic.slice(0, 50)),
            description: detail.description ? detail.description.slice(0, 350) : null,
            pushedAt: detail.pushed_at ?? null,
            authorship: authorshipFor(ownerMatch, commitMatch),
            readmeSha256: readme?.sha256 ?? null,
            readmeExcerpt: readme?.excerpt ?? null,
        });
    }
    return { claim: parsed.claim, snapshots };
}
