/**
 * COVER LETTER RENDERER
 *
 * Generates clean HTML for server-side PDF export.
 */

import {
    composeCoverLetterDocument,
    escapeCoverLetterHtml,
    renderCoverLetterBlocksHtml,
    splitCoverLetterEnding,
    type CoverLetterComposeOptions,
} from "@/lib/cover-letter-document";

export function generateCoverLetterHtml(
    content: string,
    title: string,
    options: CoverLetterComposeOptions = {},
): string {
    const model = composeCoverLetterDocument(content, options);
    const parts = splitCoverLetterEnding(model.blocks, Boolean(model.appendedClosing));
    const bodyHtml = renderCoverLetterBlocksHtml(parts.body);
    const endingHtml = renderCoverLetterBlocksHtml(parts.ending);
    const letterhead = model.letterheadName
        ? `<header class="letterhead"><h1>${escapeCoverLetterHtml(model.letterheadName)}</h1></header>`
        : "";
    const closing = model.appendedClosing
        ? `<div class="signature"><p>${escapeCoverLetterHtml(model.appendedClosing.greeting)}</p><p class="signature-name">${escapeCoverLetterHtml(model.appendedClosing.name)}</p></div>`
        : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeCoverLetterHtml(title)}</title>
    <style>
        @page {
            size: A4;
            margin: 18mm 18mm 20mm 18mm;
        }
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #111111;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12pt;
            line-height: 1.4;
            -webkit-font-smoothing: antialiased;
        }
        .letterhead {
            margin: 0 0 6mm 0;
            padding: 0 0 3mm 0;
            border-bottom: 1pt solid #000000;
        }
        .letterhead h1 {
            font-size: 16pt;
            font-weight: 700;
            letter-spacing: 0.01em;
            line-height: 1.25;
            color: #000000;
            overflow-wrap: anywhere;
            text-transform: none;
            margin: 0;
        }
        .cl-content {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12pt;
            color: #111111;
            line-height: 1.4;
        }
        .cl-para {
            margin: 0 0 10pt 0;
            text-align: left;
            overflow-wrap: break-word;
            orphans: 3;
            widows: 3;
        }
        .cl-ending { break-inside: avoid; page-break-inside: avoid; }
        .cl-list {
            margin: 0 0 10pt 0;
            padding-left: 1.2em;
        }
        .cl-list li {
            margin-bottom: 0.4em;
            text-align: left;
            overflow-wrap: break-word;
        }
        strong { font-weight: 700; color: #000000; }
        .signature {
            margin-top: 0;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12pt;
            page-break-inside: avoid;
        }
        .signature p { margin: 0 0 10pt; }
        .signature .signature-name {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 700;
            font-size: 12pt;
            color: #000000;
            overflow-wrap: anywhere;
        }
    </style>
</head>
<body>
    ${letterhead}
    <div class="cl-content">
        ${bodyHtml}
        <div class="cl-ending">${endingHtml}${closing}</div>
    </div>
</body>
</html>`;
}
