"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { accountLinkErrorMessage } from "@/lib/account-link-errors";

type Provider = "linkedin" | "github";
type LinkedAccount = { id: string; providerId: string; accountId: string };
type RepositoryRow = {
  repoId: string;
  fullName: string;
  private: boolean;
  language: string | null;
  authorship: string;
  description: string | null;
  excerpt: string | null;
  removed: boolean;
};
type InstallStatus = {
  linked: boolean;
  installation: null | { accountLogin: string; accountType: string; repositorySelection: string; suspended: boolean };
  lastSync: null | { status: string; errorCode: string | null; repoCount: number | null; finishedAt: string | null };
  repositories: RepositoryRow[];
  retainedEvidence: boolean;
};

function canAccept(repo: RepositoryRow) {
  return !repo.removed && Boolean(repo.language) && repo.authorship !== "not_confirmed";
}

export function ConnectedAccounts({ available, githubAppConfigured }: { available: Record<Provider, boolean>; githubAppConfigured: boolean }) {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<InstallStatus | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const result = await authClient.listAccounts();
    if (result.error) throw new Error(result.error.message);
    setAccounts((result.data || []).map(item => ({ id: item.id, providerId: item.providerId, accountId: item.accountId })));
  }, []);

  const refreshInstall = useCallback(async () => {
    const response = await fetch("/api/github/install");
    if (!response.ok) return;
    setStatus(await response.json() as InstallStatus);
  }, []);

  const queryError = accountLinkErrorMessage(searchParams.get("error"), searchParams.get("github_error"));
  const shownError = error ?? queryError;

  useEffect(() => {
    Promise.resolve().then(refresh).catch(cause => setError(cause instanceof Error ? cause.message : "Could not load connected accounts."))
      .finally(() => setLoading(false));
    Promise.resolve().then(refreshInstall).catch(() => undefined);
  }, [refresh, refreshInstall]);

  async function connect(provider: Provider) {
    setError("");
    setBusy(provider);
    try {
      const result = await authClient.linkSocial({ provider, callbackURL: "/dashboard/settings?tab=account" });
      if (result.error) throw new Error(result.error.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start connection.");
      setBusy(null);
    }
  }

  async function disconnect(provider: Provider, id: string) {
    setError("");
    setBusy(provider);
    try {
      const result = await authClient.unlinkAccount({ accountId: id });
      if (result.error) throw new Error(result.error.message);
      await refresh();
      await refreshInstall();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not disconnect account.");
    } finally { setBusy(null); }
  }

  async function postInstall(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "GitHub request failed.");
    return payload;
  }

  async function install() {
    setError("");
    setBusy("install");
    try {
      const payload = await postInstall("/api/github/install/start");
      if (typeof payload.url === "string") window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start installation.");
      setBusy(null);
    }
  }

  async function sync() {
    setError("");
    setBusy("sync");
    try {
      setStatus(await postInstall("/api/github/sync"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sync repositories.");
    } finally { setBusy(null); }
  }

  async function accept() {
    setError("");
    setBusy("accept");
    try {
      await postInstall("/api/github/accept", { repoIds: selected });
      setSelected([]);
      await refreshInstall();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add evidence.");
    } finally { setBusy(null); }
  }

  async function removeInstallation() {
    setError("");
    setBusy("remove");
    try {
      const response = await fetch("/api/github/install", { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Could not remove the installation.");
      setStatus(payload as InstallStatus);
      setSelected([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove the installation.");
    } finally { setBusy(null); }
  }

  const githubLinked = accounts.some(item => item.providerId === "github");

  return <section className="rounded-2xl border border-neutral-200 p-5" aria-label="Connected accounts">
    <h3 className="text-base font-semibold">Connected accounts</h3>
    <p className="mt-1 text-sm text-neutral-600">Stay signed in with your current Zebra account. Connecting LinkedIn or GitHub attaches that identity to this account; it does not replace your Google sign-in.</p>
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="font-medium">Google · Zebra sign-in</p>
        <p className="text-xs text-neutral-600">{loading ? "Checking…" : accounts.some(item => item.providerId === "google") ? "Connected to this Zebra account" : "This Zebra account uses another sign-in method"}</p>
      </div>
      {(["linkedin", "github"] as const).map(provider => {
        const linked = accounts.find(item => item.providerId === provider);
        const name = provider === "linkedin" ? "LinkedIn" : "GitHub";
        return <div key={provider} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{name} · linked account</p>
              <p className="text-xs text-neutral-600">{loading ? "Checking…" : linked ? "Linked to this Zebra account" : available[provider] ? "Not linked" : "Setup required by Zebra"}</p>
              {provider === "linkedin" && <p className="mt-1 text-xs text-neutral-500">Full profile sections still require your export or approved LinkedIn API access.</p>}
              {provider === "github" && <p className="mt-1 text-xs text-neutral-500">Repository access requires a separate GitHub App installation. A link is not repository access.</p>}
            </div>
            {linked ? <button type="button" disabled={busy !== null} onClick={() => disconnect(provider, linked.id)} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Disconnect</button>
              : <button type="button" disabled={loading || busy !== null || !available[provider]} onClick={() => connect(provider)} className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Link {name} to Zebra</button>}
          </div>
          {provider === "github" && <div className="mt-4 space-y-3 border-t border-neutral-200 pt-3">
            <button type="button" disabled={busy !== null || !githubLinked || !githubAppConfigured} onClick={install} className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Install repositories</button>
            {status?.installation && <div className="text-xs text-neutral-600">
              <p>Installed on {status.installation.accountLogin} · {status.installation.repositorySelection === "all" ? "all repositories" : "selected repositories"}{status.installation.suspended ? " · suspended" : ""}</p>
              <p>{status.lastSync ? `Last sync ${status.lastSync.status}${status.lastSync.errorCode ? ` (${status.lastSync.errorCode})` : ""}` : "No sync yet"}</p>
            </div>}
            {status?.installation && !status.installation.suspended && <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy !== null || !githubLinked} onClick={sync} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Sync repositories</button>
              <button type="button" disabled={busy !== null} onClick={removeInstallation} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Remove installation</button>
            </div>}
            {status?.installation?.suspended && <button type="button" disabled={busy !== null} onClick={removeInstallation} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Remove installation</button>}
            {!status?.installation && status?.retainedEvidence && <p className="text-xs text-neutral-600">The GitHub installation is gone. Accepted repository evidence stays in your evidence graph.</p>}
            <ul className="space-y-2">
              {(status?.repositories || []).filter(repo => !repo.removed).map(repo => <li key={repo.repoId} className="rounded-lg border border-neutral-200 p-3 text-xs">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" disabled={!canAccept(repo) || busy !== null} checked={selected.includes(repo.repoId)} onChange={(event) => setSelected(current => event.target.checked ? [...current, repo.repoId] : current.filter(id => id !== repo.repoId))} />
                  <span>
                    <span className="font-semibold">{repo.fullName}</span>
                    {repo.private ? " · private" : " · public"}
                    {repo.language ? ` · ${repo.language}` : " · no language"}
                    {` · ${repo.authorship === "not_confirmed" ? "visible, not personal evidence" : repo.authorship.replace("_", " ")}`}
                    {repo.description && <span className="mt-1 block text-neutral-600">{repo.description}</span>}
                    {repo.excerpt && <span className="mt-1 block text-neutral-500">{repo.excerpt}</span>}
                  </span>
                </label>
              </li>)}
            </ul>
            {selected.length > 0 && <button type="button" disabled={busy !== null} onClick={accept} className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Add selected repositories as evidence</button>}
          </div>}
        </div>;
      })}
    </div>
    {shownError && <p role="alert" className="mt-3 text-sm text-rose-700">{shownError}</p>}
  </section>;
}
