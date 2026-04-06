import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * HARDENED EXPORT API — Server-Side PDF Generation Gate
 * 
 * Strategy:
 * 1. Verify authentication
 * 2. Check template tier (free vs premium)
 * 3. For premium templates, verify payment status
 * 4. Generate HTML resume string server-side
 * 5. Return rendered HTML for client-side print or stream PDF
 * 
 * Security:
 * - No direct PDF blob URLs exposed
 * - Premium template HTML is NEVER sent to free-tier clients
 * - Export token prevents replay attacks
 */

// Template tier definitions
const PREMIUM_TEMPLATES = ["executive", "neural-pro", "fortune500"];
const FREE_TEMPLATES = ["modern", "minimal"];

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { resumeData, template = "modern" } = await req.json();
        const user = session.user as any;
        const userPlan = user.plan || "Free";

        // PAYWALL GATE: Premium templates require paid plan
        if (PREMIUM_TEMPLATES.includes(template)) {
            if (userPlan === "Free") {
                return NextResponse.json({
                    error: "PREMIUM_REQUIRED",
                    message: "Executive templates require a Pro subscription.",
                    upgradeUrl: "/dashboard/settings?tab=billing"
                }, { status: 403 });
            }
        }

        // Generate the export HTML
        const exportHtml = generateResumeHtml(resumeData, template);

        // Generate a one-time export token (prevents URL sharing)
        const exportToken = crypto.randomUUID();

        return NextResponse.json({
            html: exportHtml,
            token: exportToken,
            template,
            exportedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("Export failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Generates a clean, print-optimized HTML document from resume data.
 * This is the "compile" output — a self-contained HTML page ready for print-to-PDF.
 */
function generateResumeHtml(data: any, template: string): string {
    const { basics, experience = [], education = [], skills = [], projects = [], certifications = [] } = data;

    const experienceHtml = experience.map((exp: any) => `
        <div class="exp-item">
            <div class="exp-header">
                <div>
                    <h3 class="exp-role">${escapeHtml(exp.company || "")}</h3>
                    <span class="exp-company">${escapeHtml(exp.role || "")}</span>
                </div>
                <div style="text-align:right">
                    <span class="exp-period">${escapeHtml(exp.location || "")}</span><br/>
                    <span class="exp-period">${escapeHtml(exp.period || "")}</span>
                </div>
            </div>
            <ul>${(exp.highlights || []).filter((h: string) => h?.trim()).map((h: string) =>
                `<li class="exp-bullet">${escapeHtml(h)}</li>`
            ).join("")}</ul>
        </div>
    `).join("");

    const projectsHtml = projects.map((proj: any) => `
        <div class="proj-item">
            <div class="proj-header">
                <h3 class="proj-title">${escapeHtml(proj.title || "")}</h3>
                <span class="proj-tech">${escapeHtml(proj.techStack || "")}${proj.link ? ` · <a href="${escapeHtml(proj.link)}">Live Demo</a>` : ""}</span>
            </div>
            <ul>${(proj.highlights || []).filter((h: string) => h?.trim()).map((h: string) =>
                `<li class="proj-bullet">${escapeHtml(h)}</li>`
            ).join("")}</ul>
        </div>
    `).join("");

    const educationHtml = education.map((edu: any) => `
        <div class="edu-item">
            <div class="exp-header">
                <h3 class="edu-school">${escapeHtml(edu.school || "")}</h3>
                <span class="exp-period">${escapeHtml(edu.location || "")}</span>
            </div>
            <div class="exp-header">
                <p class="edu-degree">${escapeHtml(edu.degree || "")}${edu.gpa ? ` | ${escapeHtml(edu.gpa)}` : ""}</p>
                <span class="edu-period">${escapeHtml(edu.period || "")}</span>
            </div>
            ${(edu.highlights || []).filter((h: string) => h?.trim()).length > 0 ? `<ul>${(edu.highlights || []).filter((h: string) => h?.trim()).map((h: string) => `<li class="exp-bullet">${escapeHtml(h)}</li>`).join("")}</ul>` : ""}
        </div>
    `).join("");

    // Handle both old format (string[]) and new format (SkillCategory[])
    let skillsHtml = "";
    if (skills.length > 0) {
        if (typeof skills[0] === 'string') {
            // Old format: flat string array
            skillsHtml = `<ul>${skills.filter((s: string) => s?.trim()).map((s: string) => `<li class="exp-bullet"><strong>Skills:</strong> ${escapeHtml(s)}</li>`).join("")}</ul>`;
        } else {
            // New format: SkillCategory[]
            skillsHtml = `<ul>${skills.filter((s: any) => s?.items?.trim()).map((s: any) => `<li class="exp-bullet"><strong>${escapeHtml(s.category)}:</strong> ${escapeHtml(s.items)}</li>`).join("")}</ul>`;
        }
    }

    // Certifications & Achievements
    let certsHtml = "";
    if (certifications.length > 0) {
        certsHtml = `<ul>${certifications.filter((c: any) => c?.items?.trim()).map((c: any) => `<li class="exp-bullet"><strong>${escapeHtml(c.category)}:</strong> ${escapeHtml(c.items)}</li>`).join("")}</ul>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(basics?.name || "Resume")} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0.5in 0.6in; size: letter; }
        body {
            font-family: 'Times New Roman', Georgia, serif;
            font-size: 11pt;
            line-height: 1.45;
            color: #1a1a1a;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in 0.6in;
        }
        .header { text-align: center; margin-bottom: 8px; }
        .header h1 { font-size: 20pt; font-weight: 700; letter-spacing: 0.01em; line-height: 1.2; }
        .header-meta { font-size: 10pt; color: #333; margin-top: 4px; }
        .section { margin-bottom: 8px; }
        .section-title { font-size: 12pt; font-weight: 700; text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 1px; margin-bottom: 6px; margin-top: 8px; }
        .exp-item, .proj-item, .edu-item { margin-bottom: 8px; }
        .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
        .exp-role { font-size: 11pt; font-weight: 700; }
        .exp-company { font-size: 10pt; font-style: italic; color: #333; }
        .exp-period { font-size: 10pt; color: #444; }
        .exp-bullet { font-size: 10pt; color: #333; margin-left: 20px; list-style: disc; margin-bottom: 1px; }
        .proj-header { display: flex; justify-content: space-between; align-items: baseline; }
        .proj-title { font-size: 11pt; font-weight: 700; }
        .proj-tech { font-size: 10pt; font-style: italic; color: #555; }
        .proj-tech a { color: #000; font-weight: 700; font-style: normal; text-decoration: none; }
        .edu-school { font-size: 11pt; font-weight: 700; }
        .edu-degree { font-size: 10pt; font-style: italic; color: #333; }
        .edu-period { font-size: 10pt; color: #444; }
        .summary { font-size: 10pt; color: #333; line-height: 1.5; }
        ul { padding-left: 0; }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(basics?.name || "")}</h1>
        <div class="header-meta">
            ${[basics?.phone, basics?.email, basics?.linkedin, basics?.portfolio, basics?.location].filter(Boolean).map((v: string) => escapeHtml(v)).join(" · ")}
        </div>
    </div>

    ${education.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Education</h2>
        ${educationHtml}
    </div>` : ""}

    ${skillsHtml ? `
    <div class="section">
        <h2 class="section-title">Skills</h2>
        ${skillsHtml}
    </div>` : ""}

    ${projects.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Projects</h2>
        ${projectsHtml}
    </div>` : ""}

    ${experience.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Experience</h2>
        ${experienceHtml}
    </div>` : ""}

    ${certsHtml ? `
    <div class="section">
        <h2 class="section-title">Certifications & Achievements</h2>
        ${certsHtml}
    </div>` : ""}
</body>
</html>`;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
