import type { ResumeContent, ResumeSourceSpan } from "../components/compiler/types";

function collectGroundingClaims(content: ResumeContent): Array<{ path: string; text: string }> {
    const claims: Array<{ path: string; text: string }> = [];
    const add = (path: string, value: string | undefined) => {
        const text = value?.trim();
        if (text) claims.push({ path, text });
    };

    Object.entries(content.basics).forEach(([field, value]) => add(`basics.${field}`, value));
    content.experience.forEach((entry, index) => {
        add(`experience.${index}.company`, entry.company);
        add(`experience.${index}.location`, entry.location);
        add(`experience.${index}.role`, entry.role);
        add(`experience.${index}.period`, entry.period);
        entry.techStack?.split(/[,;|]/).forEach((value, item) => add(`experience.${index}.techStack.${item}`, value));
        add(`experience.${index}.link`, entry.link);
        entry.highlights.forEach((value, bullet) => add(`experience.${index}.highlights.${bullet}`, value));
    });
    content.education.forEach((entry, index) => {
        add(`education.${index}.school`, entry.school);
        add(`education.${index}.location`, entry.location);
        add(`education.${index}.degree`, entry.degree);
        add(`education.${index}.gpa`, entry.gpa);
        add(`education.${index}.period`, entry.period);
        entry.highlights.forEach((value, bullet) => add(`education.${index}.highlights.${bullet}`, value));
    });
    content.projects.forEach((entry, index) => {
        add(`projects.${index}.title`, entry.title);
        entry.techStack?.split(/[,;|]/).forEach((value, item) => add(`projects.${index}.techStack.${item}`, value));
        add(`projects.${index}.link`, entry.link);
        entry.highlights.forEach((value, bullet) => add(`projects.${index}.highlights.${bullet}`, value));
    });
    content.skills.forEach((entry, index) => {
        add(`skills.${index}.category`, entry.category);
        entry.items.split(/[,;|]/).forEach((value, item) => add(`skills.${index}.items.${item}`, value));
    });
    content.certifications.forEach((entry, index) => {
        add(`certifications.${index}.category`, entry.category);
        entry.items.split(/[;|]/).forEach((value, item) => add(`certifications.${index}.items.${item}`, value));
    });
    return claims;
}

/** Bound evidence to the named entry, stopping at the next entry or section. */
export function getClaimSourceContext(content: ResumeContent, path: string, source: string): { start: number; text: string } | null {
    const [section, indexText] = path.split(".");
    if (section !== "experience" && section !== "projects") return { start: 0, text: source };
    const entry = content[section][Number(indexText)];
    const anchor = section === "experience" ? content.experience[Number(indexText)]?.company : content.projects[Number(indexText)]?.title;
    if (!entry || !anchor?.trim()) return null;
    const searchable = source.toLowerCase();
    const start = searchable.indexOf(anchor.trim().toLowerCase());
    if (start < 0) return null;
    // Repeated anchors are ambiguous; retain a review warning rather than choose a role.
    if (searchable.indexOf(anchor.trim().toLowerCase(), start + anchor.length) >= 0) return null;
    let end = source.length;
    const anchors = [...content.experience.map(e => e.company), ...content.projects.map(e => e.title), ...content.education.map(e => e.school)];
    for (const other of anchors) {
        if (!other?.trim() || other === anchor) continue;
        const next = searchable.indexOf(other.trim().toLowerCase(), start + anchor.length);
        if (next >= 0) end = Math.min(end, next);
    }
    const rest = source.slice(start + anchor.length);
    const heading = /(?:^|\n)\s*(?:education|skills|technical skills|projects|experience|work experience|certifications|summary)\s*(?::|\n|$)/i.exec(rest);
    if (heading) end = Math.min(end, start + anchor.length + heading.index);
    // Do not cross unrecognized lines: they may identify an omitted role.
    // Only continue through lines copied from this entry's own mapped fields.
    const known = section === "experience" ? content.experience[Number(indexText)] : content.projects[Number(indexText)];
    const copiedFields = [...known.highlights, "location" in known ? known.location : "", known.link,
        ...("role" in known ? [known.role, known.period] : [])].filter((value): value is string => Boolean(value?.trim()));
    const candidate = source.slice(start, end);
    const firstBreak = candidate.indexOf("\n");
    if (firstBreak >= 0) {
        let offset = firstBreak + 1;
        for (const line of candidate.slice(offset).split("\n")) {
            const text = line.trim().replace(/^[-*•]\s*/, "");
            if (text && !copiedFields.some(value => value.trim().toLowerCase() === text.toLowerCase())) {
                end = start + offset;
                break;
            }
            offset += line.length + 1;
        }
    }
    return { start, text: source.slice(start, end) };
}

function findTechnology(source: string, text: string): number {
    const searchable = source.toLowerCase();
    const needle = text.toLowerCase();
    let start = searchable.indexOf(needle);
    while (start >= 0) {
        const before = source[start - 1] || "";
        const after = source[start + text.length] || "";
        const nameCharacter = /[\p{L}\p{N}_+#]/u;
        const dotSuffix = after === "." && nameCharacter.test(source[start + text.length + 1] || "");
        if (!nameCharacter.test(before) && !nameCharacter.test(after) && !dotSuffix) return start;
        start = searchable.indexOf(needle, start + 1);
    }
    return -1;
}

/** Locate claims; technology lists require evidence within their own entry. */
export function groundResumeContent(content: ResumeContent, sourceText: string): ResumeSourceSpan[] {
    const searchable = sourceText.toLocaleLowerCase();
    return collectGroundingClaims(content).map(({ path, text }) => {
        const isTechnology = /^(experience|projects)\.\d+\.techStack\./.test(path);
        const context = isTechnology ? getClaimSourceContext(content, path, sourceText) : null;
        const localStart = context ? findTechnology(context.text, text) : -1;
        const start = isTechnology ? (context && localStart >= 0 ? context.start + localStart : -1) : searchable.indexOf(text.toLocaleLowerCase());
        return {
            path,
            text,
            start: start >= 0 ? start : null,
            end: start >= 0 ? start + text.length : null,
            grounded: start >= 0,
        };
    });
}

