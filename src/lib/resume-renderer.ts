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
    id?: number | string;
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
        summary?: string;
    };
    experience?: WorkExperience[];
    education?: Education[];
    skills?: (string | Skill)[];
    projects?: Project[];
    certifications?: (string | Skill)[];
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

function cleanDisplayUrl(url: string): string {
    if (!url) return "";
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/** Converts inline markdown (**bold**, *italic*, `code`) safely to HTML */
function formatMarkdown(text: string): string {
    if (!text) return "";
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

export function generateResumeHtml(
    data: ResumeData, 
    template: string = "modern", 
    fontFamily?: string,
    documentTitle?: string
): string {
    const { 
        basics, 
        experience = [], 
        education = [], 
        skills = [], 
        projects = [], 
        certifications = [] 
    } = data;

    const name = basics?.name?.trim() || "Resume";
    const title = documentTitle || `${name} - Resume`;

    const fontConfig = {
        name: fontFamily || (template === "minimal" ? "Inter" : "Latin Modern Roman"),
        url: (fontFamily === "Latin Modern Roman" || (!fontFamily && template !== "minimal")) 
            ? "https://cdn.jsdelivr.net/npm/@fontsource/latin-modern-roman@5.0.11/index.css"
            : `https://fonts.googleapis.com/css2?family=${(fontFamily || (template === "minimal" ? "Inter" : "STIX+Two+Text")).replace(/\s+/g, '+')}:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap`
    };

    // Header Meta Rows (clean LaTeX format with dot separators)
    const contactRow1 = [];
    if (basics?.location) contactRow1.push(`<span>${escapeHtml(basics.location)}</span>`);
    if (basics?.phone) contactRow1.push(`<span>${escapeHtml(basics.phone)}</span>`);
    if (basics?.email) contactRow1.push(`<a href="mailto:${escapeHtml(basics.email)}">${escapeHtml(basics.email)}</a>`);

    const contactRow2 = [];
    if (basics?.linkedin) {
        contactRow2.push(`<a href="${ensureAbsoluteUrl(basics.linkedin)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanDisplayUrl(basics.linkedin))}</a>`);
    }
    if (basics?.portfolio) {
        contactRow2.push(`<a href="${ensureAbsoluteUrl(basics.portfolio)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanDisplayUrl(basics.portfolio))}</a>`);
    }

    // 1. Education HTML
    const educationHtml = education.map((edu: Education) => `
        <div class="entry">
            <div class="entry-row">
                <span class="bold font-header">${escapeHtml(edu.school || "")}</span>
                <span class="right">${escapeHtml(edu.location || "")}</span>
            </div>
            <div class="entry-row">
                <span>
                    <em>${escapeHtml(edu.degree || "")}</em>
                    ${edu.gpa ? ` — <strong>CGPA: ${escapeHtml(edu.gpa)}</strong>` : ""}
                </span>
                <span class="right bold">${escapeHtml(edu.period ? (edu.period.toLowerCase().startsWith('grad') ? edu.period : `Graduation: ${edu.period}`) : "")}</span>
            </div>
            ${edu.highlights && edu.highlights.filter(h => h?.trim()).length > 0 ? `
                <ul class="bullet-list">
                    ${edu.highlights.filter(h => h?.trim()).map(h => `<li>${formatMarkdown(h)}</li>`).join("")}
                </ul>
            ` : ""}
        </div>
    `).join("");

    // 2. Skills HTML (rendered as clean LaTeX bulleted categories)
    let skillsHtml = "";
    if (skills.length > 0) {
        skillsHtml = `<ul class="bullet-list skills-list">`;
        skills.forEach((s) => {
            if (typeof s === 'string') {
                if (s.trim()) skillsHtml += `<li>${formatMarkdown(s)}</li>`;
            } else if (s.category || s.items) {
                skillsHtml += `<li><strong>${escapeHtml(s.category || "Skills")}:</strong> ${formatMarkdown(s.items || "")}</li>`;
            }
        });
        skillsHtml += `</ul>`;
    }

    // 3. Projects HTML
    const projectsHtml = projects.map((proj: Project) => {
        const hasLinks = !!proj.link;
        return `
        <div class="entry">
            <div class="entry-row">
                <div>
                    <span class="bold font-header">${escapeHtml(proj.title || "")}</span>
                    ${proj.techStack ? `<span class="proj-tech"> — <strong>${escapeHtml(proj.techStack)}</strong></span>` : ""}
                </div>
                ${hasLinks ? `
                    <div class="right">
                        <a href="${ensureAbsoluteUrl(proj.link!)}" target="_blank" rel="noopener noreferrer" class="italic-link">GitHub — Live Demo</a>
                    </div>
                ` : ""}
            </div>
            ${proj.highlights && proj.highlights.filter(h => h?.trim()).length > 0 ? `
                <ul class="bullet-list">
                    ${proj.highlights.filter(h => h?.trim()).map(h => `<li>${formatMarkdown(h)}</li>`).join("")}
                </ul>
            ` : ""}
        </div>
    `;}).join("");

    // 4. Experience HTML
    const experienceHtml = experience.map((exp: WorkExperience) => `
        <div class="entry">
            <div class="entry-row">
                <span class="bold font-header">${escapeHtml(exp.company || "")}</span>
                <span class="right">${escapeHtml(exp.location || "")}</span>
            </div>
            <div class="entry-row">
                <span><em>${escapeHtml(exp.role || "")}</em></span>
                <span class="right">${escapeHtml(exp.period || "")}</span>
            </div>
            ${exp.highlights && exp.highlights.filter(h => h?.trim()).length > 0 ? `
                <ul class="bullet-list">
                    ${exp.highlights.filter(h => h?.trim()).map(h => `<li>${formatMarkdown(h)}</li>`).join("")}
                </ul>
            ` : ""}
        </div>
    `).join("");

    // 5. Achievements & Certifications HTML
    let certsHtml = "";
    if (certifications.length > 0) {
        certsHtml = `<ul class="bullet-list">`;
        certifications.forEach((c) => {
            if (typeof c === 'string') {
                if (c.trim()) certsHtml += `<li>${formatMarkdown(c)}</li>`;
            } else if (c.category || c.items) {
                certsHtml += `<li><strong>${escapeHtml(c.category || "Certifications")}:</strong> ${formatMarkdown(c.items || "")}</li>`;
            }
        });
        certsHtml += `</ul>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${fontConfig.url}">
    <style>
        @page { 
            size: A4; 
            margin: 0; 
        }
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        body {
            font-family: '${fontConfig.name}', 'Latin Modern Roman', 'STIX Two Text', 'Times New Roman', Georgia, serif;
            font-size: 10pt;
            line-height: 1.35;
            color: #111111;
            padding: 14mm 18mm;
            background: #ffffff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        a { 
            color: #111111; 
            text-decoration: none; 
        }
        a:hover {
            text-decoration: underline;
        }

        /* ── HEADER ── */
        .header { 
            text-align: center; 
            margin-bottom: 12px; 
        }
        .header h1 { 
            font-size: 23pt; 
            font-weight: 700; 
            color: #000000; 
            margin-bottom: 4px; 
            letter-spacing: 0.01em;
            line-height: 1.1;
        }
        .header-meta { 
            font-size: 9.5pt; 
            color: #222222;
            line-height: 1.4;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 2px 0;
        }
        .header-meta .sep {
            margin: 0 5px;
            color: #555555;
            font-weight: 400;
        }

        /* ── SECTIONS ── */
        .section { 
            margin-top: 10px; 
            margin-bottom: 2px;
        }
        .section-title { 
            font-size: 11pt; 
            font-weight: 700; 
            text-transform: uppercase; 
            border-bottom: 1px solid #111111; 
            padding-bottom: 1px; 
            margin-bottom: 5px;
            color: #000000;
            letter-spacing: 0.04em;
            line-height: 1.25;
        }

        /* ── ENTRIES & ROWS ── */
        .entry { 
            margin-bottom: 6px; 
        }
        .entry-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: baseline; 
            font-size: 9.5pt;
            line-height: 1.35;
        }
        .bold { 
            font-weight: 700; 
            color: #000000; 
        }
        .right { 
            text-align: right; 
            white-space: nowrap; 
            margin-left: 8px;
        }
        .italic-link {
            font-style: italic;
            color: #222222;
        }

        /* ── BULLET LISTS ── */
        .bullet-list { 
            list-style: disc; 
            margin-left: 18px; 
            margin-top: 2px; 
            padding-left: 0; 
        }
        .bullet-list li { 
            font-size: 9.5pt; 
            color: #111111; 
            margin-bottom: 2.5px; 
            line-height: 1.35;
            text-align: justify;
        }
        .bullet-list li strong {
            font-weight: 700;
            color: #000000;
        }
        .skills-list li {
            margin-bottom: 2px;
        }

        /* Page Number Footer */
        .page-footer {
            position: fixed;
            bottom: 6mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt;
            color: #444444;
        }

        ${template === 'minimal' ? `
            body { font-family: 'Inter', sans-serif; }
            .section-title { border-bottom: none; color: #0A0A0A; font-size: 10pt; font-weight: 800; background: #f4f4f5; padding: 2px 6px; border-radius: 3px; }
        ` : ''}

        ${template === 'professional' ? `
            .header { text-align: left; }
            .header-meta { justify-content: flex-start; }
            .section-title { border-bottom: 1.5px solid #000; }
        ` : ''}
    </style>
</head>
<body>
    <!-- ── HEADER ── -->
    <div class="header">
        <h1>${escapeHtml(name)}</h1>
        ${contactRow1.length > 0 ? `
            <div class="header-meta">
                ${contactRow1.join('<span class="sep">·</span>')}
            </div>
        ` : ""}
        ${contactRow2.length > 0 ? `
            <div class="header-meta">
                ${contactRow2.join('<span class="sep">·</span>')}
            </div>
        ` : ""}
    </div>

    <!-- ── 1. EDUCATION ── -->
    ${education.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Education</h2>
            ${educationHtml}
        </div>
    ` : ""}

    <!-- ── 2. TECHNICAL SKILLS & COMPETENCIES ── -->
    ${skillsHtml ? `
        <div class="section">
            <h2 class="section-title">Technical Skills & Competencies</h2>
            ${skillsHtml}
        </div>
    ` : ""}

    <!-- ── 3. SOFTWARE DEVELOPMENT PROJECTS ── -->
    ${projects.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Software Development Projects</h2>
            ${projectsHtml}
        </div>
    ` : ""}

    <!-- ── 4. EXPERIENCE ── -->
    ${experience.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Experience</h2>
            ${experienceHtml}
        </div>
    ` : ""}

    <!-- ── 5. ACHIEVEMENTS & CERTIFICATIONS ── -->
    ${certsHtml ? `
        <div class="section">
            <h2 class="section-title">Achievements & Certifications</h2>
            ${certsHtml}
        </div>
    ` : ""}

    <!-- ── 6. SUMMARY (if provided) ── -->
    ${basics?.summary ? `
        <div class="section">
            <h2 class="section-title">Summary</h2>
            <p style="font-size: 9.5pt; line-height: 1.38; color: #111111;">${formatMarkdown(basics.summary)}</p>
        </div>
    ` : ""}

    <!-- Page Number -->
    <div class="page-footer">1</div>
</body>
</html>`;
}
