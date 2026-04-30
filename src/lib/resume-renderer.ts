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

const ICONS = {
    phone: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
    mail: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`,
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
    globe: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    map: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`
};

export function generateResumeHtml(data: ResumeData, template: string = "modern", fontFamily?: string): string {
    const { basics, experience = [], education = [], skills = [], projects = [], certifications = [] } = data;

    const fontConfig = {
        name: fontFamily || (template === "minimal" ? "Inter" : "Latin Modern Roman"),
        url: (fontFamily === "Latin Modern Roman" || (!fontFamily && template !== "minimal")) 
            ? "https://cdn.jsdelivr.net/npm/@fontsource/latin-modern-roman@5.0.11/index.css"
            : `https://fonts.googleapis.com/css2?family=${(fontFamily || (template === "minimal" ? "Inter" : "Outfit")).replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`
    };

    const experienceHtml = (experience as WorkExperience[]).map((exp: WorkExperience) => `
        <div class="item">
            <div class="item-header">
                <span class="item-title">${escapeHtml(exp.role || "")}</span>
                <span class="item-date">${escapeHtml(exp.period || "")}</span>
            </div>
            <div class="item-header sub">
                <span class="item-sub">${escapeHtml(exp.company || "")}${exp.location ? `, ${escapeHtml(exp.location)}` : ""}</span>
            </div>
            <ul class="item-list">${(exp.highlights || []).filter((h: string) => h?.trim()).map((h: string) =>
                `<li>${escapeHtml(h)}</li>`
            ).join("")}</ul>
        </div>
    `).join("");

    const projectsHtml = (projects as Project[]).map((proj: Project) => `
        <div class="item">
            <div class="item-header">
                <span class="item-title">${escapeHtml(proj.title || "")}</span>
                <span class="item-sub italic">${escapeHtml(proj.techStack || "")}</span>
            </div>
            <ul class="item-list">${(proj.highlights || []).filter((h: string) => h?.trim()).map((h: string) =>
                `<li>${escapeHtml(h)}</li>`
            ).join("")}</ul>
        </div>
    `).join("");

    const educationHtml = (education as Education[]).map((edu: Education) => `
        <div class="item">
            <div class="item-header">
                <span class="item-title">${escapeHtml(edu.school || "")}</span>
                <span class="item-date">${escapeHtml(edu.period || "")}</span>
            </div>
            <div class="item-header sub">
                <span class="item-sub">${escapeHtml(edu.degree || "")}${edu.gpa ? ` (GPA: ${escapeHtml(edu.gpa)})` : ""}</span>
                <span class="item-date">${escapeHtml(edu.location || "")}</span>
            </div>
        </div>
    `).join("");

    let skillsHtml = "";
    if (skills.length > 0) {
        if (typeof skills[0] === 'string') {
            skillsHtml = `<p class="skills-text"><strong>Skills:</strong> ${(skills as string[]).join(", ")}</p>`;
        } else {
            skillsHtml = (skills as Skill[]).map(s => `
                <p class="skills-text"><strong>${escapeHtml(s.category || "")}:</strong> ${escapeHtml(s.items || "")}</p>
            `).join("");
        }
    }

    const metaItems = [];
    if (basics?.phone) metaItems.push(`<div class="meta-item">${ICONS.phone} ${escapeHtml(basics.phone)}</div>`);
    if (basics?.email) metaItems.push(`<div class="meta-item">${ICONS.mail} <a href="mailto:${escapeHtml(basics.email)}">${escapeHtml(basics.email)}</a></div>`);
    if (basics?.linkedin) metaItems.push(`<div class="meta-item">${ICONS.linkedin} <a href="${ensureAbsoluteUrl(basics.linkedin)}">${escapeHtml(basics.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ""))}</a></div>`);
    if (basics?.portfolio) metaItems.push(`<div class="meta-item">${ICONS.globe} <a href="${ensureAbsoluteUrl(basics.portfolio)}">${escapeHtml(basics.portfolio.replace(/^https?:\/\/(www\.)?/, ""))}</a></div>`);
    if (basics?.location) metaItems.push(`<div class="meta-item">${ICONS.map} ${escapeHtml(basics.location)}</div>`);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="${fontConfig.url}">
    <style>
        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: '${fontConfig.name}', ${template === 'minimal' ? 'sans-serif' : 'serif'};
            font-size: 10pt;
            line-height: 1.4;
            color: #1f2937;
            padding: 15mm 20mm;
            background: white;
            -webkit-font-smoothing: antialiased;
        }
        a { color: inherit; text-decoration: none; }
        
        .header { margin-bottom: 24px; }
        .header h1 { 
            font-size: 24pt; 
            font-weight: 700; 
            color: #111827; 
            margin-bottom: 6px; 
            letter-spacing: -0.03em;
            line-height: 1;
        }
        .header-meta { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 12px; 
            font-size: 8.5pt; 
            color: #4b5563;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
        }
        .meta-item { display: flex; align-items: center; gap: 4px; }
        .meta-item svg { flex-shrink: 0; }
        
        .section { margin-top: 18px; }
        .section-title { 
            font-size: 10pt; 
            font-weight: 700; 
            text-transform: uppercase; 
            border-bottom: 1pt solid #e5e7eb; 
            padding-bottom: 4px; 
            margin-bottom: 8px;
            color: #111827;
            letter-spacing: 0.05em;
        }
        
        .item { margin-bottom: 12px; }
        .item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .item-header.sub { margin-top: 1px; }
        .item-title { font-size: 10.5pt; font-weight: 700; color: #111827; }
        .item-sub { font-size: 10pt; font-weight: 600; color: #374151; }
        .item-sub.italic { font-style: italic; font-weight: 500; color: #6b7280; }
        .item-date { font-size: 9pt; color: #6b7280; font-weight: 500; }
        
        .item-list { list-style: none; margin-top: 4px; padding-left: 4px; }
        .item-list li { 
            font-size: 9.5pt; 
            color: #4b5563; 
            margin-bottom: 3px; 
            position: relative;
            padding-left: 12px;
            line-height: 1.4;
        }
        .item-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #9ca3af;
        }
        
        .skills-text { font-size: 9.5pt; margin-bottom: 4px; color: #4b5563; }
        .skills-text strong { font-weight: 700; color: #111827; }

        ${template === 'minimal' ? `
            body { font-family: 'Inter', sans-serif; }
            .section-title { border-bottom: none; color: #3b82f6; font-size: 9pt; }
            .item-title { color: #1e40af; }
        ` : ''}

        ${template === 'professional' ? `
            .header h1 { text-transform: uppercase; letter-spacing: 0.02em; }
            .section-title { background: #f3f4f6; border: none; padding: 4px 8px; border-radius: 2px; }
        ` : ''}
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(basics?.name || "")}</h1>
        <div class="header-meta">
            ${metaItems.join(" · ")}
        </div>
    </div>

    ${experience.length > 0 ? `<div class="section"><h2 class="section-title">Experience</h2>${experienceHtml}</div>` : ""}
    ${projects.length > 0 ? `<div class="section"><h2 class="section-title">Projects</h2>${projectsHtml}</div>` : ""}
    ${skillsHtml ? `<div class="section"><h2 class="section-title">Skills & Expertise</h2>${skillsHtml}</div>` : ""}
    ${education.length > 0 ? `<div class="section"><h2 class="section-title">Education</h2>${educationHtml}</div>` : ""}
    ${certifications.length > 0 ? `<div class="section"><h2 class="section-title">Certifications</h2>${certifications.map(c => `<p class="skills-text">${escapeHtml(typeof c === 'string' ? c : c.items || "")}</p>`).join("")}</div>` : ""}
</body>
</html>`;
}

function escapeHtml(str: string): string {
    return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function ensureAbsoluteUrl(url: string): string {
    if (!url) return "";
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        return url;
    }
    return `https://${url}`;
}
