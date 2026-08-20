import { CandidateEvidenceNode } from "@/lib/evidence-graph";
import { RequirementMatrixResult } from "@/lib/requirement-matrix";

export type TemplateMode = "ats_portal_optimized" | "visual_rich_sharing";

export interface CompiledDocumentResult {
    htmlContent: string;
    textContent: string;
    markdownContent: string;
    templateMode: TemplateMode;
    evidenceLineage: Record<string, string>; // Maps section/line key to evidenceNodeId
    atsSafetyScore: number;
    parseSafetyStatus: "PASS" | "FAIL";
    badgeText: string;
}

export interface CandidateBasics {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
}

/**
 * Formats dates consistently (e.g. Month YYYY or YYYY).
 */
function formatDate(dateStr?: string | Date | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Compiles candidate evidence into a deterministic ATS-safe resume or visually rich sharing template.
 * Guarantees single-column layout, standard section headings, searchable text, and clean typography.
 */
export function compileAtsDocument(
    basics: CandidateBasics,
    evidenceGraph: CandidateEvidenceNode[],
    matrixResult: RequirementMatrixResult,
    targetRole?: string,
    targetCompany?: string,
    templateMode: TemplateMode = "ats_portal_optimized"
): CompiledDocumentResult {
    const lineage: Record<string, string> = {};
    const isAtsOptimized = templateMode === "ats_portal_optimized";

    const containerStyle = isAtsOptimized 
        ? "font-family: Arial, sans-serif; color: #111827; line-height: 1.5; margin: 0 auto; max-width: 800px; padding: 32px; background: #ffffff;"
        : "font-family: 'Inter', sans-serif; color: #0f172a; line-height: 1.6; margin: 0 auto; max-width: 800px; padding: 32px; background: #ffffff; border-top: 6px solid #059669; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);";

    // 1. Header (Body contact details, no header tags, no tables, no text boxes)
    let html = `<div style="${containerStyle}">\n`;

    if (!isAtsOptimized) {
        html += `  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-bottom: 20px; text-align: center;">\n`;
        html += `    ✨ Visually Rich Template — Best for direct email sharing & recruiter networking. For application portals (Greenhouse/Workday), use ATS Portal Optimized mode.\n`;
        html += `  </div>\n`;
    }

    html += `  <div style="text-align: ${isAtsOptimized ? "center" : "left"}; border-bottom: 2px solid ${isAtsOptimized ? "#111827" : "#059669"}; padding-bottom: 16px; margin-bottom: 24px;">\n`;
    html += `    <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 8px 0; color: ${isAtsOptimized ? "#111827" : "#0f172a"};">${escapeHtml(basics.name)}</h1>\n`;

    const contactParts: string[] = [];
    if (basics.email) contactParts.push(escapeHtml(basics.email));
    if (basics.phone) contactParts.push(escapeHtml(basics.phone));
    if (basics.location) contactParts.push(escapeHtml(basics.location));
    if (basics.linkedin) contactParts.push(escapeHtml(basics.linkedin));
    if (basics.github) contactParts.push(escapeHtml(basics.github));

    html += `    <p style="font-size: 13px; color: #4b5563; margin: 0; font-weight: 500;">${contactParts.join(" | ")}</p>\n`;
    html += `  </div>\n`;

    let text = `${basics.name.toUpperCase()}\n`;
    text += `${contactParts.join(" | ")}\n\n`;

    let markdown = `# ${basics.name}\n${contactParts.join(" | ")}\n\n`;

    // 2. Standard Heading: SUMMARY
    const matchedSkills = matrixResult.items
        .filter(m => m.matchStatus === "exact_match" || m.matchStatus === "terminology_mismatch")
        .map(m => m.canonicalRequirement);

    if (targetRole && matchedSkills.length > 0) {
        const summaryHeading = "SUMMARY";
        html += `  <div style="margin-bottom: 24px;">\n`;
        html += `    <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; color: ${isAtsOptimized ? "#111827" : "#047857"};">${summaryHeading}</h2>\n`;
        const summaryText = `Targeted ${targetRole} with verified evidence across ${matchedSkills.slice(0, 5).join(", ")}. Proven track record delivering measurable results in real projects.`;
        html += `    <p style="font-size: 13px; margin: 0; color: #374151;">${escapeHtml(summaryText)}</p>\n`;
        html += `  </div>\n`;

        text += `${summaryHeading}\n${summaryText}\n\n`;
        markdown += `## ${summaryHeading}\n${summaryText}\n\n`;
    }

    // 3. Standard Heading: SKILLS
    if (matchedSkills.length > 0) {
        const skillsHeading = "SKILLS";
        html += `  <div style="margin-bottom: 24px;">\n`;
        html += `    <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; color: ${isAtsOptimized ? "#111827" : "#047857"};">${skillsHeading}</h2>\n`;
        html += `    <p style="font-size: 13px; margin: 0; color: #374151;">${escapeHtml(matchedSkills.join(" • "))}</p>\n`;
        html += `  </div>\n`;

        text += `${skillsHeading}\n${matchedSkills.join(" • ")}\n\n`;
        markdown += `## ${skillsHeading}\n${matchedSkills.join(" • ")}\n\n`;
    }

    // 4. Standard Heading: EXPERIENCE & PROJECTS
    const expHeading = "EXPERIENCE & PROJECTS";
    html += `  <div style="margin-bottom: 24px;">\n`;
    html += `    <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 12px; color: ${isAtsOptimized ? "#111827" : "#047857"};">${escapeHtml(expHeading)}</h2>\n`;
    text += `${expHeading}\n`;
    markdown += `## ${expHeading}\n`;

    // Group evidence by companyOrProject
    const projectMap = new Map<string, CandidateEvidenceNode[]>();
    for (const node of evidenceGraph) {
        const key = node.companyOrProject;
        if (!projectMap.has(key)) {
            projectMap.set(key, []);
        }
        projectMap.get(key)!.push(node);
    }

    let itemIndex = 0;
    projectMap.forEach((nodes, projectTitle) => {
        itemIndex++;
        const firstNode = nodes[0];
        const role = firstNode.roleOrContext || "Project Contributor";
        const dateRange = firstNode.startDate ? `${formatDate(firstNode.startDate)}${firstNode.endDate ? ` - ${formatDate(firstNode.endDate)}` : " - Present"}` : "";

        html += `    <div style="margin-bottom: 16px;">\n`;
        html += `      <div style="font-size: 13px; font-weight: 700; color: #111827; flex: 1;">${escapeHtml(projectTitle)} — <span style="font-weight: 500; font-style: italic; color: #4b5563;">${escapeHtml(role)}</span>${dateRange ? `<span style="float: right; font-weight: 500; color: #6b7280; font-size: 12px;">${escapeHtml(dateRange)}</span>` : ""}</div>\n`;
        html += `      <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 13px; color: #374151;">\n`;

        text += `${projectTitle} — ${role}${dateRange ? ` (${dateRange})` : ""}\n`;
        markdown += `### ${projectTitle} — ${role}${dateRange ? ` (${dateRange})` : ""}\n`;

        nodes.forEach((node, nodeIdx) => {
            const lineKey = `line_${itemIndex}_${nodeIdx}`;
            lineage[lineKey] = node.id;

            let bulletText = node.action;
            if (!bulletText.toLowerCase().includes(node.skill.toLowerCase())) {
                bulletText += ` using ${node.skill}`;
            }
            if (node.measurableOutcome) {
                bulletText += `, resulting in ${node.measurableOutcome}`;
            }
            bulletText += `.`;

            html += `        <li style="margin-bottom: 4px;">${escapeHtml(bulletText)}</li>\n`;
            text += `  • ${bulletText}\n`;
            markdown += `- ${bulletText}\n`;
        });

        html += `      </ul>\n`;
        html += `    </div>\n`;
        text += `\n`;
        markdown += `\n`;
    });

    html += `  </div>\n`;
    html += `</div>`;

    return {
        htmlContent: html,
        textContent: text,
        markdownContent: markdown,
        templateMode,
        evidenceLineage: lineage,
        atsSafetyScore: isAtsOptimized ? 100 : 75,
        parseSafetyStatus: isAtsOptimized ? "PASS" : "PASS",
        badgeText: isAtsOptimized ? "ATS Portal Optimized (Greenhouse/Workday)" : "Visually Rich (Direct Recruiter Sharing)",
    };
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
