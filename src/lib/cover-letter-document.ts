/**
 * Shared cover-letter document model for screen previews and PDF export.
 * Rendering never rewrites stored letter content.
 */

import { parseStoredResumeContent } from "@/lib/resume-content";

const PLACEHOLDER_NAME = /^(applicant(?:\s+name)?|professional candidate|your name|candidate|user|name)$/i;
const CLOSING_LINE =
    /^(sincerely|respectfully yours|respectfully|yours sincerely|yours truly|yours faithfully|best regards|kind regards|warm regards|with regards|regards|best wishes|thank you|thanks|cordially|with appreciation|faithfully yours|best)[,.\s]*$/i;
const SALUTATION_LINE = /^(dear\b|to whom it may concern\b)/i;
const MONTH_DATE_LINE =
    /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}$/i;
const NUMERIC_DATE_LINE = /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/;

export type CoverLetterBlock =
    | { type: "blank" }
    | { type: "paragraph"; html: string }
    | { type: "list"; items: string[] };

export type CoverLetterDocumentModel = {
    letterheadName: string | null;
    blocks: CoverLetterBlock[];
    appendedClosing: { greeting: string; name: string } | null;
    hasExistingClosing: boolean;
    identityName: string | null;
};

export type CoverLetterComposeOptions = {
    candidateName?: string | null;
};

export function escapeCoverLetterHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function sanitizeCandidateName(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const name = value.replace(/\s+/g, " ").trim();
    if (!name || name.length > 120) return undefined;
    if (PLACEHOLDER_NAME.test(name)) return undefined;
    if (/https?:\/\//i.test(name) || name.includes("@")) return undefined;
    return name;
}

export function candidateNameFromStoredResume(storedContent: string | null | undefined): string | undefined {
    return sanitizeCandidateName(parseStoredResumeContent(storedContent).basics.name);
}

function isPlausibleInferredName(name: string): boolean {
    if (PLACEHOLDER_NAME.test(name)) return false;
    if (SALUTATION_LINE.test(name) || CLOSING_LINE.test(name) || isDateLine(name)) return false;
    if (/^(hiring manager|recruiting team|human resources|search committee)\b/i.test(name)) return false;
    if (/[/\\]/.test(name) || /\d/.test(name)) return false;
    const words = name.split(" ").filter(Boolean);
    if (words.length < 1 || words.length > 8) return false;
    return words.every((word) => /^[\p{L}][\p{L}.'’-]*$/u.test(word));
}

function isDateLine(value: string): boolean {
    const text = value.trim();
    return MONTH_DATE_LINE.test(text) || NUMERIC_DATE_LINE.test(text);
}

function isListLine(value: string): boolean {
    return /^([*-]|•)\s+/.test(value);
}

function listItemText(value: string): string {
    return value.replace(/^([*-]|•)\s+/, "");
}

function unwrapSupportedMarkdown(value: string): string {
    let current = value;
    let previous = "";
    while (current !== previous) {
        previous = current;
        current = current
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/\*(.+?)\*/g, "$1");
    }
    return current;
}

function identityText(value: string): string {
    return unwrapSupportedMarkdown(value).replace(/\s+/g, " ").trim();
}

function formatInlineMarkdown(value: string): string {
    return escapeCoverLetterHtml(value)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<strong>$1</strong>");
}

export function formatCoverLetterBlocks(content: string): CoverLetterBlock[] {
    const lines = content.replace(/\r\n/g, "\n").split("\n");
    const blocks: CoverLetterBlock[] = [];
    let listItems: string[] | null = null;

    const flushList = () => {
        if (listItems && listItems.length > 0) {
            blocks.push({ type: "list", items: listItems });
        }
        listItems = null;
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList();
            blocks.push({ type: "blank" });
            continue;
        }
        if (isListLine(trimmed)) {
            listItems = listItems ?? [];
            listItems.push(formatInlineMarkdown(listItemText(trimmed)));
            continue;
        }
        flushList();
        blocks.push({ type: "paragraph", html: formatInlineMarkdown(trimmed) });
    }
    flushList();
    return blocks;
}

function nonEmptyLines(lines: string[]): { index: number; text: string }[] {
    return lines
        .map((line, index) => ({ index, text: identityText(line) }))
        .filter((line) => line.text.length > 0);
}

function inferNameFromLetter(lines: string[]): string | undefined {
    const populated = nonEmptyLines(lines);
    const closing = [...populated].reverse().find((line) => CLOSING_LINE.test(line.text));
    if (!closing) return undefined;
    const after = populated.find((line) => line.index > closing.index);
    if (after && isPlausibleInferredName(after.text)) {
        return sanitizeCandidateName(after.text);
    }
    return undefined;
}

export function missingReferencedResumeIds(
    referencedIds: Array<string | null | undefined>,
    loadedIds: Iterable<string>,
): string[] {
    const known = new Set(loadedIds);
    const missing: string[] = [];
    const seen = new Set<string>();
    for (const id of referencedIds) {
        const resumeId = typeof id === "string" ? id.trim() : "";
        if (!resumeId || known.has(resumeId) || seen.has(resumeId)) continue;
        seen.add(resumeId);
        missing.push(resumeId);
    }
    return missing;
}

function letterHasOwnLetterhead(lines: string[]): boolean {
    const populated = nonEmptyLines(lines);
    const salutation = populated.find((line) => SALUTATION_LINE.test(line.text));
    const preamble = populated.filter((line) => (salutation ? line.index < salutation.index : line.index < 6));
    const first = preamble[0];
    return Boolean(first && isPlausibleInferredName(first.text));
}

function letterHasClosing(lines: string[]): boolean {
    return nonEmptyLines(lines).some((line) => CLOSING_LINE.test(line.text));
}

export function composeCoverLetterDocument(
    content: string,
    options: CoverLetterComposeOptions = {},
): CoverLetterDocumentModel {
    const normalized = content.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");
    const confirmedName = sanitizeCandidateName(options.candidateName);
    const inferredName = inferNameFromLetter(lines);
    const identityName = confirmedName ?? inferredName ?? null;
    const hasExistingClosing = letterHasClosing(lines);
    const hasOwnLetterhead = letterHasOwnLetterhead(lines);

    return {
        letterheadName: hasOwnLetterhead ? null : identityName,
        blocks: formatCoverLetterBlocks(normalized),
        appendedClosing: hasExistingClosing || !identityName
            ? null
            : { greeting: "Sincerely,", name: identityName },
        hasExistingClosing,
        identityName,
    };
}

export function renderCoverLetterBlocksHtml(blocks: CoverLetterBlock[]): string {
    let html = "";
    for (const block of blocks) {
        if (block.type === "blank") {
            html += '<div class="cl-blank"></div>';
            continue;
        }
        if (block.type === "list") {
            html += `<ul class="cl-list">${block.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
            continue;
        }
        html += `<p class="cl-para">${block.html}</p>`;
    }
    return html;
}

/** Keep the final body block with the closing; oversized groups may still paginate. */
export function splitCoverLetterEnding(
    blocks: CoverLetterBlock[],
    hasAppendedClosing = false,
): { body: CoverLetterBlock[]; ending: CoverLetterBlock[] } {
    const plainParagraph = (block: CoverLetterBlock) => block.type === "paragraph"
        ? identityText(block.html.replaceAll("<strong>", "").replaceAll("</strong>", "")) : "";
    const closingIndex = blocks.findLastIndex((block) =>
        block.type === "paragraph" && CLOSING_LINE.test(plainParagraph(block)));
    if (closingIndex < 0 && !hasAppendedClosing) return { body: blocks, ending: [] };
    let start = closingIndex < 0 ? blocks.length : closingIndex;
    let previous = start - 1;
    while (previous >= 0 && blocks[previous].type === "blank") previous--;
    if (previous >= 0 && !SALUTATION_LINE.test(plainParagraph(blocks[previous]))) start = previous;
    return { body: blocks.slice(0, start), ending: blocks.slice(start) };
}
