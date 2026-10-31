import { findLinkedInSourceQuote } from "@/lib/linkedin-workflow";

export const LINKEDIN_AUDIT_VERSION = "linkedin-45-v1";
export const LINKEDIN_AUDIT_CATEGORIES = ["identity", "headline", "about", "experience", "skills", "education", "network", "activity", "seo"] as const;
export type LinkedInAuditCategory = typeof LINKEDIN_AUDIT_CATEGORIES[number];
export const LINKEDIN_AUDIT_STATUSES = ["Pass", "Partial", "Fail", "Not Applicable", "Not Assessed"] as const;
export type LinkedInAuditStatus = typeof LINKEDIN_AUDIT_STATUSES[number];
export type LinkedInPersona = "student" | "fresher" | "recentGraduate" | "professional";
export interface LinkedInCriterion {
  id: string;
  category: LinkedInAuditCategory;
  checkpoint: string;
  weight: 2 | 3;
  assessability: "text" | "profile" | "external";
  personas?: readonly LinkedInPersona[];
}

const rows: readonly [string, LinkedInAuditCategory, string, 2 | 3, LinkedInCriterion["assessability"], (readonly LinkedInPersona[])?][] = [
  ["LI-ID-01", "identity", "A clear, professional profile photo is present", 3, "profile"],
  ["LI-ID-02", "identity", "A relevant banner adds useful context", 2, "profile"],
  ["LI-ID-03", "identity", "The public profile URL is clean and shareable", 2, "text"],
  ["LI-ID-04", "identity", "The displayed name is professionally formatted", 2, "text"],
  ["LI-ID-05", "identity", "Name pronunciation is available where useful", 2, "profile"],
  ["LI-ID-06", "identity", "Location and industry match the intended audience", 2, "text"],
  ["LI-HL-01", "headline", "Headline clearly states the target role or specialty", 3, "text"],
  ["LI-HL-02", "headline", "Important role terms appear early in the headline", 3, "text"],
  ["LI-HL-03", "headline", "Headline favors specific skills over generic buzzwords", 2, "text"],
  ["LI-HL-04", "headline", "Headline explains the work or value delivered", 2, "text"],
  ["LI-HL-05", "headline", "Headline is concise and distinct enough to scan", 2, "text"],
  ["LI-AB-01", "about", "Opening lines state a clear professional focus", 3, "text"],
  ["LI-AB-02", "about", "Summary sounds specific and authentic", 2, "text"],
  ["LI-AB-03", "about", "Relevant role terms appear naturally in the summary", 3, "text"],
  ["LI-AB-04", "about", "Summary connects background, proof, and next step", 2, "text"],
  ["LI-AB-05", "about", "Summary offers a clear way to connect or see work", 2, "text"],
  ["LI-EX-01", "experience", "Relevant work, internship, project, or volunteer experience is shown", 3, "text"],
  ["LI-EX-02", "experience", "Organizations are linked to the correct pages where possible", 2, "profile"],
  ["LI-EX-03", "experience", "Descriptions show contributions and supported outcomes", 3, "text"],
  ["LI-EX-04", "experience", "Role-relevant tools and skills appear in context", 2, "text"],
  ["LI-EX-05", "experience", "Key work has relevant media or links when available", 2, "profile"],
  ["LI-EX-06", "experience", "Career transitions or gaps have helpful context when relevant", 2, "text", ["professional"]],
  ["LI-SK-01", "skills", "Most prominent skills align with the target role", 3, "profile"],
  ["LI-SK-02", "skills", "A useful range of relevant skills is listed", 2, "text"],
  ["LI-SK-03", "skills", "Skills reflect both tools and ways of working where relevant", 2, "text"],
  ["LI-SK-04", "skills", "Important skills have credible endorsements", 2, "profile"],
  ["LI-SK-05", "skills", "Skills avoid stale or unrelated filler", 2, "text"],
  ["LI-ED-01", "education", "Education entries identify institution and qualification", 2, "text"],
  ["LI-ED-02", "education", "Relevant credentials identify their issuer", 2, "text"],
  ["LI-ED-03", "education", "Featured work demonstrates relevant ability", 3, "text"],
  ["LI-ED-04", "education", "Featured items use suitable formats for the work", 2, "profile"],
  ["LI-ED-05", "education", "Relevant volunteering or extracurricular work is represented", 2, "text", ["student", "fresher", "recentGraduate"]],
  ["LI-NW-01", "network", "Connections include relevant peers and professionals", 3, "profile"],
  ["LI-NW-02", "network", "Recommendations give specific, credible examples", 3, "profile"],
  ["LI-NW-03", "network", "Recommendations support the current career direction", 2, "profile"],
  ["LI-NW-04", "network", "The member contributes useful recommendations to others", 2, "profile"],
  ["LI-NW-05", "network", "Network includes people in target fields or organizations", 2, "profile"],
  ["LI-AC-01", "activity", "Recent activity demonstrates continued participation", 3, "profile"],
  ["LI-AC-02", "activity", "Content focuses on relevant professional topics", 2, "profile"],
  ["LI-AC-03", "activity", "Content formats suit the message and audience", 2, "profile"],
  ["LI-AC-04", "activity", "Posts are easy to scan and make a clear point", 2, "profile"],
  ["LI-AC-05", "activity", "Comments add substantive, relevant insight", 3, "profile"],
  ["LI-SEO-01", "seo", "Public visibility settings allow intended discovery", 3, "external"],
  ["LI-SEO-02", "seo", "Role and skill descriptions are consistent across supplied assets", 2, "external"],
  ["LI-SEO-03", "seo", "Long-form work answers useful audience questions when relevant", 2, "profile", ["recentGraduate", "professional"]],
];

export const LINKEDIN_AUDIT_RUBRIC: readonly LinkedInCriterion[] = rows.map(([id, category, checkpoint, weight, assessability, personas]) => ({ id, category, checkpoint, weight, assessability, personas }));

const evaluationSchema = { type: "object", additionalProperties: false, required: ["status", "evidence", "fix"], properties: {
  status: { type: "string", enum: [...LINKEDIN_AUDIT_STATUSES] }, evidence: { type: "string" }, fix: { type: "string" },
} } as const;

export const LINKEDIN_AUDIT_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  name: "zebra_linkedin_audit",
  strict: true,
  schema: { type: "object", additionalProperties: false, required: ["summary", "audit"], properties: {
    summary: { type: "string" },
    audit: { type: "object", additionalProperties: false, required: [...LINKEDIN_AUDIT_CATEGORIES], properties: Object.fromEntries(
      LINKEDIN_AUDIT_CATEGORIES.map(category => [category, { type: "object", additionalProperties: false, required: LINKEDIN_AUDIT_RUBRIC.filter(item => item.category === category).map(item => item.id), properties: Object.fromEntries(LINKEDIN_AUDIT_RUBRIC.filter(item => item.category === category).map(item => [item.id, evaluationSchema])) }]),
    ) },
  } },
};

export interface LinkedInAuditItem extends LinkedInCriterion {
  status: LinkedInAuditStatus;
  evidence: string;
  fix: string;
}

export function normalizeLinkedInAudit(rawAudit: Record<string, Record<string, { status: LinkedInAuditStatus; evidence: string; fix: string }>>, persona: LinkedInPersona, sourceText?: string): LinkedInAuditItem[] {
  return LINKEDIN_AUDIT_RUBRIC.map(criterion => {
    const result = rawAudit[criterion.category]?.[criterion.id];
    if (!result) throw new Error(`Missing criterion ${criterion.id}`);
    if (criterion.personas && !criterion.personas.includes(persona)) return { ...criterion, status: "Not Applicable", evidence: "Not relevant to this career stage.", fix: "" };
    if (criterion.assessability !== "text") return { ...criterion, status: "Not Assessed", evidence: "Cannot verify from pasted profile text alone.", fix: "Review this directly on LinkedIn." };
    if (sourceText && (result.status === "Pass" || result.status === "Partial")) {
      const quote = findLinkedInSourceQuote(sourceText, result.evidence);
      if (!quote) return { ...criterion, status: "Not Assessed", evidence: "The model's positive judgment had no exact source quote.", fix: "Review this check against your profile text." };
      return { ...criterion, ...result, evidence: quote };
    }
    return { ...criterion, ...result };
  });
}

export function calculateLinkedInAuditScores(items: readonly LinkedInAuditItem[]) {
  const scoreFor = (subset: readonly LinkedInAuditItem[]) => {
    const assessed = subset.filter(item => item.status !== "Not Applicable" && item.status !== "Not Assessed");
    const possible = assessed.reduce((sum, item) => sum + item.weight, 0);
    const earned = assessed.reduce((sum, item) => sum + item.weight * (item.status === "Pass" ? 1 : item.status === "Partial" ? 0.5 : 0), 0);
    return possible ? Math.round(100 * earned / possible) : null;
  };
  return {
    overall: scoreFor(items),
    categories: Object.fromEntries(LINKEDIN_AUDIT_CATEGORIES.map(category => [category, scoreFor(items.filter(item => item.category === category))])) as Record<LinkedInAuditCategory, number | null>,
    assessed: items.filter(item => !["Not Applicable", "Not Assessed"].includes(item.status)).length,
    total: items.length,
  };
}

export function formatLinkedInAuditRubricForPrompt() {
  return LINKEDIN_AUDIT_RUBRIC.map(item => `${item.id} | ${item.category} | ${item.assessability} | ${item.checkpoint}`).join("\n");
}
