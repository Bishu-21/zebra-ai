interface WorkExperience {
    company?: string;
    role?: string;
    location?: string;
    period?: string;
    highlights?: string[];
}

interface Project {
    title?: string;
    techStack?: string;
    link?: string;
    highlights?: string[];
}

interface Education {
    school?: string;
    location?: string;
    degree?: string;
    gpa?: string;
    period?: string;
    highlights?: string[];
}

interface Skill {
    category?: string;
    items?: string;
}

interface ResumeData {
    basics?: {
        name?: string;
        phone?: string;
        email?: string;
        linkedin?: string;
        portfolio?: string;
        location?: string;
    };
    experience?: WorkExperience[];
    education?: Education[];
    skills?: (string | Skill)[];
    projects?: Project[];
    certifications?: Skill[];
}

export function generateResumeHtml(data: ResumeData, _template: string): string {
    const { basics, experience = [], education = [], skills = [], projects = [], certifications = [] } = data;

    const experienceHtml = (experience as WorkExperience[]).map((exp: WorkExperience) => `
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

    const projectsHtml = (projects as Project[]).map((proj: Project) => `
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

    const educationHtml = (education as Education[]).map((edu: Education) => `
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

    let skillsHtml = "";
    if (skills.length > 0) {
        if (typeof skills[0] === 'string') {
            skillsHtml = `<ul>${(skills as string[]).filter((s: string) => s?.trim()).map((s: string) => `<li class="exp-bullet"><strong>Skills:</strong> ${escapeHtml(s)}</li>`).join("")}</ul>`;
        } else {
            skillsHtml = `<ul>${(skills as Skill[]).filter((s: Skill) => s?.items?.trim()).map((s: Skill) => `<li class="exp-bullet"><strong>${escapeHtml(s.category || "")}:</strong> ${escapeHtml(s.items || "")}</li>`).join("")}</ul>`;
        }
    }

    let certsHtml = "";
    if (certifications && certifications.length > 0) {
        certsHtml = `<ul>${(certifications as Skill[]).filter((c: Skill) => c?.items?.trim()).map((c: Skill) => `<li class="exp-bullet"><strong>${escapeHtml(c.category || "")}:</strong> ${escapeHtml(c.items || "")}</li>`).join("")}</ul>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(basics?.name || "Resume")} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Times New Roman', Georgia, serif;
            font-size: 11pt;
            line-height: 1.45;
            color: #1a1a1a;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm 18mm;
            background: white;
        }
        .header { text-align: center; margin-bottom: 8px; }
        .header h1 { font-size: 20pt; font-weight: 700; letter-spacing: 0.01em; line-height: 1.2; }
        .header-meta { font-size: 10pt; color: #333; margin-top: 4px; }
        .section { margin-bottom: 8px; }
        .section-title { font-size: 12pt; font-weight: 700; text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 1px; margin-bottom: 6px; margin-top: 8px; }
        .exp-item, .proj-item, .edu-item { margin-bottom: 8px; }
        .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
        .exp-role { font-size: 11pt; font-weight: 700; }
        .exp-company { font-size: 10pt; font-weight: 500; color: #333; }
        .exp-period { font-size: 10pt; color: #444; }
        .exp-bullet { font-size: 10pt; color: #333; margin-left: 20px; list-style: disc; margin-bottom: 1px; }
        .proj-header { display: flex; justify-content: space-between; align-items: baseline; }
        .proj-title { font-size: 11pt; font-weight: 700; }
        .proj-tech { font-size: 10pt; font-weight: 500; color: #555; }
        .proj-tech a { color: #000; font-weight: 700; text-decoration: none; }
        .edu-school { font-size: 11pt; font-weight: 700; }
        .edu-degree { font-size: 10pt; font-weight: 500; color: #333; }
        .edu-period { font-size: 10pt; color: #444; }
        .summary { font-size: 10pt; color: #333; line-height: 1.5; }
        ul { padding-left: 0; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(basics?.name || "")}</h1>
        <div class="header-meta">
            ${([basics?.phone, basics?.email, basics?.linkedin, basics?.portfolio, basics?.location].filter(Boolean) as string[]).map((v: string) => escapeHtml(v)).join(" · ")}
        </div>
    </div>
    ${education.length > 0 ? `<div class="section"><h2 class="section-title">Education</h2>${educationHtml}</div>` : ""}
    ${skillsHtml ? `<div class="section"><h2 class="section-title">Skills</h2>${skillsHtml}</div>` : ""}
    ${projects.length > 0 ? `<div class="section"><h2 class="section-title">Projects</h2>${projectsHtml}</div>` : ""}
    ${experience.length > 0 ? `<div class="section"><h2 class="section-title">Experience</h2>${experienceHtml}</div>` : ""}
    ${certsHtml ? `<div class="section"><h2 class="section-title">Certifications & Achievements</h2>${certsHtml}</div>` : ""}
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
