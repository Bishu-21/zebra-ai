import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, evidenceNodes, githubInstallationRepositories, githubInstallations, githubSyncRuns } from "@/lib/schema";
import type { InstallationClaim, RepositorySnapshot, WebhookEffect } from "@/lib/github-app";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function scoped<T>(userId: string, operation: (tx: Tx) => Promise<T>): Promise<T> {
    if (!userId) throw new Error("User scope is required.");
    return db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
        return operation(tx);
    });
}

function reviewExcerpt(repo: { private: boolean; readmeExcerpt: string | null }): string | null {
    return repo.readmeExcerpt;
}

export async function getLinkedGitHubAccount(userId: string) {
    const [row] = await db.select({ accountId: account.accountId, accessToken: account.accessToken })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
        .limit(1);
    return row ?? null;
}

export async function findInstallationOwner(installationId: string): Promise<string | null> {
    return db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.github_installation_id', ${installationId}, true)`);
        const [row] = await tx.select({ userId: githubInstallations.userId })
            .from(githubInstallations)
            .where(eq(githubInstallations.installationId, installationId))
            .limit(1);
        return row?.userId ?? null;
    });
}

export async function saveGitHubInstallation(userId: string, claim: InstallationClaim) {
    await scoped(userId, async (tx) => {
        await tx.delete(githubInstallations).where(eq(githubInstallations.userId, userId));
        await tx.insert(githubInstallations).values({
            id: `ghi_${randomUUID()}`,
            userId,
            installationId: claim.installationId,
            accountLogin: claim.accountLogin,
            accountId: claim.accountId,
            accountType: claim.accountType,
            repositorySelection: claim.repositorySelection,
            permissions: claim.permissions,
            suspendedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });
}

export async function getGitHubInstallStatus(userId: string) {
    return scoped(userId, async (tx) => {
        const linked = await tx.select({ id: account.id }).from(account)
            .where(and(eq(account.userId, userId), eq(account.providerId, "github"))).limit(1);
        const [installation] = await tx.select().from(githubInstallations)
            .where(eq(githubInstallations.userId, userId)).limit(1);
        const repositories = installation
            ? await tx.select().from(githubInstallationRepositories)
                .where(eq(githubInstallationRepositories.githubInstallationId, installation.id))
            : [];
        const [lastSync] = await tx.select().from(githubSyncRuns)
            .where(eq(githubSyncRuns.userId, userId))
            .orderBy(desc(githubSyncRuns.startedAt))
            .limit(1);
        const [evidence] = await tx.select({ id: evidenceNodes.id }).from(evidenceNodes)
            .where(and(eq(evidenceNodes.userId, userId), eq(evidenceNodes.source, "git")))
            .limit(1);
        return {
            linked: linked.length > 0,
            installation: installation ? {
                accountLogin: installation.accountLogin,
                accountType: installation.accountType,
                repositorySelection: installation.repositorySelection,
                suspended: Boolean(installation.suspendedAt),
            } : null,
            lastSync: lastSync ? {
                status: lastSync.status,
                errorCode: lastSync.errorCode,
                repoCount: lastSync.repoCount,
                finishedAt: lastSync.finishedAt?.toISOString() ?? null,
            } : null,
            repositories: repositories.map((repo) => ({
                repoId: repo.repoId,
                fullName: repo.fullName,
                private: repo.private,
                language: repo.language,
                authorship: repo.authorship,
                description: repo.description,
                htmlUrl: repo.htmlUrl,
                excerpt: reviewExcerpt(repo),
                removed: Boolean(repo.removedAt),
            })),
            retainedEvidence: Boolean(evidence),
        };
    });
}

export async function openSyncRun(userId: string) {
    return scoped(userId, async (tx) => {
        const [installation] = await tx.select().from(githubInstallations)
            .where(eq(githubInstallations.userId, userId)).limit(1);
        if (!installation) return { error: "no_installation" as const };
        if (installation.suspendedAt) return { error: "suspended" as const };
        const runId = `ghs_${randomUUID()}`;
        await tx.insert(githubSyncRuns).values({
            id: runId,
            userId,
            githubInstallationId: installation.id,
            status: "running",
            repoCount: null,
            startedAt: new Date(),
        });
        return { runId, installationId: installation.installationId, localId: installation.id };
    });
}

export async function completeSyncRun(userId: string, runId: string, localId: string, claim: InstallationClaim, snapshots: RepositorySnapshot[]) {
    await scoped(userId, async (tx) => {
        const now = new Date();
        await tx.update(githubInstallations).set({
            accountLogin: claim.accountLogin,
            accountId: claim.accountId,
            accountType: claim.accountType,
            repositorySelection: claim.repositorySelection,
            permissions: claim.permissions,
            suspendedAt: null,
            updatedAt: now,
        }).where(and(eq(githubInstallations.id, localId), eq(githubInstallations.userId, userId)));
        const seen = new Set<string>();
        for (const repo of snapshots) {
            seen.add(repo.repoId);
            await tx.insert(githubInstallationRepositories).values({
                id: `ghr_${randomUUID()}`,
                githubInstallationId: localId,
                userId,
                repoId: repo.repoId,
                fullName: repo.fullName,
                private: repo.private,
                defaultBranch: repo.defaultBranch,
                htmlUrl: repo.htmlUrl,
                language: repo.language,
                topics: repo.topics,
                description: repo.description,
                pushedAt: parseTime(repo.pushedAt),
                authorship: repo.authorship,
                readmeSha256: repo.readmeSha256,
                readmeExcerpt: repo.readmeExcerpt,
                removedAt: null,
            }).onConflictDoUpdate({
                target: [githubInstallationRepositories.githubInstallationId, githubInstallationRepositories.repoId],
                set: {
                    fullName: repo.fullName,
                    private: repo.private,
                    defaultBranch: repo.defaultBranch,
                    htmlUrl: repo.htmlUrl,
                    language: repo.language,
                    topics: repo.topics,
                    description: repo.description,
                    pushedAt: parseTime(repo.pushedAt),
                    authorship: repo.authorship,
                    readmeSha256: repo.readmeSha256,
                    readmeExcerpt: repo.readmeExcerpt,
                    removedAt: null,
                },
            });
        }
        const existing = await tx.select({ repoId: githubInstallationRepositories.repoId })
            .from(githubInstallationRepositories)
            .where(eq(githubInstallationRepositories.githubInstallationId, localId));
        const missing = existing.map((row) => row.repoId).filter((repoId) => !seen.has(repoId));
        if (missing.length > 0) {
            await tx.update(githubInstallationRepositories).set({ removedAt: now })
                .where(and(
                    eq(githubInstallationRepositories.githubInstallationId, localId),
                    eq(githubInstallationRepositories.userId, userId),
                    inArray(githubInstallationRepositories.repoId, missing),
                ));
        }
        await tx.update(githubSyncRuns).set({ status: "succeeded", errorCode: null, repoCount: snapshots.length, finishedAt: now })
            .where(and(eq(githubSyncRuns.id, runId), eq(githubSyncRuns.userId, userId)));
    });
}

export async function failSyncRun(userId: string, runId: string, errorCode: string) {
    await scoped(userId, async (tx) => {
        await tx.update(githubSyncRuns).set({ status: "failed", errorCode, finishedAt: new Date() })
            .where(and(eq(githubSyncRuns.id, runId), eq(githubSyncRuns.userId, userId)));
    });
}

export async function markInstallationSuspended(userId: string) {
    await scoped(userId, async (tx) => {
        const now = new Date();
        const [installation] = await tx.select({ id: githubInstallations.id }).from(githubInstallations)
            .where(eq(githubInstallations.userId, userId)).limit(1);
        if (!installation) return;
        await tx.update(githubInstallations).set({ suspendedAt: now, updatedAt: now })
            .where(eq(githubInstallations.id, installation.id));
        await tx.update(githubInstallationRepositories).set({ removedAt: now })
            .where(eq(githubInstallationRepositories.githubInstallationId, installation.id));
    });
}

export async function loadRepositoriesForAccept(userId: string, repoIds: string[]) {
    return scoped(userId, async (tx) => {
        if (repoIds.length === 0) return [];
        return tx.select({
            repoId: githubInstallationRepositories.repoId,
            fullName: githubInstallationRepositories.fullName,
            language: githubInstallationRepositories.language,
            description: githubInstallationRepositories.description,
            htmlUrl: githubInstallationRepositories.htmlUrl,
            authorship: githubInstallationRepositories.authorship,
            removedAt: githubInstallationRepositories.removedAt,
        }).from(githubInstallationRepositories).where(and(
            eq(githubInstallationRepositories.userId, userId),
            inArray(githubInstallationRepositories.repoId, repoIds),
        ));
    });
}

export async function peekGitHubInstallationId(userId: string): Promise<string | null> {
    return scoped(userId, async (tx) => {
        const [installation] = await tx.select({ installationId: githubInstallations.installationId })
            .from(githubInstallations).where(eq(githubInstallations.userId, userId)).limit(1);
        return installation?.installationId ?? null;
    });
}

function parseTime(value: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export async function deleteLocalGitHubInstallation(userId: string) {
    return scoped(userId, async (tx) => {
        const [installation] = await tx.select({ id: githubInstallations.id, installationId: githubInstallations.installationId })
            .from(githubInstallations).where(eq(githubInstallations.userId, userId)).limit(1);
        if (!installation) return null;
        await tx.delete(githubInstallations).where(and(eq(githubInstallations.id, installation.id), eq(githubInstallations.userId, userId)));
        return { installationId: installation.installationId };
    });
}

export async function applyGitHubWebhook(effect: WebhookEffect): Promise<"applied" | "ignored"> {
    if (effect.op === "ignore") return "ignored";
    return db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.github_installation_id', ${effect.installationId}, true)`);
        const [installation] = await tx.select().from(githubInstallations)
            .where(eq(githubInstallations.installationId, effect.installationId)).limit(1);
        if (!installation) return "ignored";
        await tx.execute(sql`SELECT set_config('app.user_id', ${installation.userId}, true)`);
        const now = new Date();
        if (effect.op === "suspend") {
            await tx.update(githubInstallations).set({ suspendedAt: now, updatedAt: now })
                .where(eq(githubInstallations.id, installation.id));
            await tx.update(githubInstallationRepositories).set({ removedAt: now })
                .where(eq(githubInstallationRepositories.githubInstallationId, installation.id));
            return "applied";
        }
        if (effect.op === "unsuspend") {
            await tx.update(githubInstallations).set({ suspendedAt: null, updatedAt: now })
                .where(eq(githubInstallations.id, installation.id));
            return "applied";
        }
        for (const repo of effect.added) {
            await tx.insert(githubInstallationRepositories).values({
                id: `ghr_${randomUUID()}`,
                githubInstallationId: installation.id,
                userId: installation.userId,
                repoId: repo.repoId,
                fullName: repo.fullName,
                private: repo.private,
                topics: [],
                authorship: "not_confirmed",
                removedAt: null,
            }).onConflictDoUpdate({
                target: [githubInstallationRepositories.githubInstallationId, githubInstallationRepositories.repoId],
                set: { fullName: repo.fullName, private: repo.private, removedAt: null },
            });
        }
        if (effect.removedRepoIds.length > 0) {
            await tx.update(githubInstallationRepositories).set({ removedAt: now }).where(and(
                eq(githubInstallationRepositories.githubInstallationId, installation.id),
                inArray(githubInstallationRepositories.repoId, effect.removedRepoIds),
            ));
        }
        return "applied";
    });
}
