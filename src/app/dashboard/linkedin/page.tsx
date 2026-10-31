import { getDashboardSession } from "@/lib/auth-helpers";
import { getLatestLinkedInAudit, getWorkspaceWorkEvidence } from "@/lib/linkedin-audit-store";
import { LinkedInOptimizer } from "@/components/dashboard/LinkedInOptimizer";
import type { LinkedInAuditResult } from "@/components/dashboard/LinkedInAuditResults";
import type { LinkedInDraft, WorkspaceWorkEvidence } from "@/lib/linkedin-workflow";
import { getCandidateEvidenceGraph } from "@/lib/evidence-graph";
import { LinkedInWeeklyPresence } from "@/components/dashboard/LinkedInWeeklyPresence";

export default async function LinkedInPage() {
  const session = await getDashboardSession();
  let initialResult: LinkedInAuditResult | null = null;
  let initialAuditId: string | null = null;
  let initialDrafts: LinkedInDraft[] | null = null;
  let initialUrl: string | null = null;
  let initialTargetRole: string | null = null;
  let initialProfileText: string | null = null;
  let workItems: WorkspaceWorkEvidence[] = [];
  let proofs: Array<{ id: string; project: string; skill: string; action: string; outcome: string | null; url: string | null }> = [];
  if (session) {
    try {
      const latest = await getLatestLinkedInAudit(session.user.id);
      initialResult = latest?.feedback as LinkedInAuditResult | null || null;
      initialAuditId = latest?.id || null;
      initialDrafts = Array.isArray(latest?.drafts) ? latest.drafts as LinkedInDraft[] : null;
      initialUrl = latest?.linkedinUrl || null;
      initialTargetRole = latest?.targetRole || null;
      initialProfileText = latest?.sourceText || null;
    } catch (error) {
      console.warn("LinkedIn audit history unavailable:", error instanceof Error ? error.message : String(error));
    }
    try {
      workItems = await getWorkspaceWorkEvidence(session.user.id);
    } catch (error) {
      console.warn("LinkedIn workspace work unavailable:", error instanceof Error ? error.message : String(error));
    }
    try {
      const graphProofs = (await getCandidateEvidenceGraph(session.user.id)).filter(node => node.action && node.skill).slice(0, 30).map(node => ({ id: node.id, project: node.companyOrProject, skill: node.skill, action: node.action, outcome: node.measurableOutcome || null, url: node.proofUrl || null }));
      const workProofs = workItems.map((item) => ({
        id: item.id,
        project: item.title,
        skill: item.tools?.[0] || item.category,
        action: item.description || item.title,
        outcome: item.result ?? null,
        url: item.proofUrl ?? null,
      }));
      const seen = new Set<string>();
      proofs = [...workProofs, ...graphProofs].filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } catch (error) {
      console.warn("LinkedIn proof suggestions unavailable:", error instanceof Error ? error.message : String(error));
    }
  }
  return (
    <LinkedInOptimizer
      initialResult={initialResult}
      initialAuditId={initialAuditId}
      initialDrafts={initialDrafts}
      initialUrl={initialUrl}
      initialTargetRole={initialTargetRole}
      initialProfileText={initialProfileText}
      workItems={workItems}
      profileName={session?.user.name}
    >
      {session ? <LinkedInWeeklyPresence userId={session.user.id} proofs={proofs} /> : null}
    </LinkedInOptimizer>
  );
}
