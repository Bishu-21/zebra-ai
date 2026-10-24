import { getSafeSession } from "@/lib/auth-helpers";
import { getLatestLinkedInAudit } from "@/lib/linkedin-audit-store";
import { LinkedInOptimizer } from "@/components/dashboard/LinkedInOptimizer";
import type { LinkedInAuditResult } from "@/components/dashboard/LinkedInAuditResults";
import type { LinkedInDraft } from "@/lib/linkedin-workflow";
import { getCandidateEvidenceGraph } from "@/lib/evidence-graph";
import { LinkedInWeeklyPresence } from "@/components/dashboard/LinkedInWeeklyPresence";

export default async function LinkedInPage() {
  const session = await getSafeSession();
  let initialResult: LinkedInAuditResult | null = null;
  let initialAuditId: string | null = null;
  let initialDrafts: LinkedInDraft[] | null = null;
  let initialUrl: string | null = null;
  let initialTargetRole: string | null = null;
  let proofs: Array<{ id: string; project: string; skill: string; action: string; outcome: string | null; url: string | null }> = [];
  if (session) {
    try {
      const latest = await getLatestLinkedInAudit(session.user.id);
      initialResult = latest?.feedback as LinkedInAuditResult | null || null;
      initialAuditId = latest?.id || null;
      initialDrafts = Array.isArray(latest?.drafts) ? latest.drafts as LinkedInDraft[] : null;
      initialUrl = latest?.linkedinUrl || null;
      initialTargetRole = latest?.targetRole || null;
    } catch (error) {
      console.warn("LinkedIn audit history unavailable:", error instanceof Error ? error.message : String(error));
    }
    try {
      proofs = (await getCandidateEvidenceGraph(session.user.id)).filter(node => node.action && node.skill).slice(0, 30).map(node => ({ id: node.id, project: node.companyOrProject, skill: node.skill, action: node.action, outcome: node.measurableOutcome || null, url: node.proofUrl || null }));
    } catch (error) {
      console.warn("LinkedIn proof suggestions unavailable:", error instanceof Error ? error.message : String(error));
    }
  }
  return <><LinkedInOptimizer initialResult={initialResult} initialAuditId={initialAuditId} initialDrafts={initialDrafts} initialUrl={initialUrl} initialTargetRole={initialTargetRole} />{session && <div className="px-5 pb-8 sm:px-8"><LinkedInWeeklyPresence userId={session.user.id} proofs={proofs} /></div>}</>;
}
