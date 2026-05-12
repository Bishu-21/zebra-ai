/**
 * COVER LETTER RENDERER
 * 
 * Generates clean HTML for server-side PDF export.
 */

export function generateCoverLetterHtml(content: string, title: string): string {
    const lines = content.split('\n');
    let htmlContent = "";
    let inList = false;

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            if (inList) {
                htmlContent += "</ul>";
                inList = false;
            }
            htmlContent += '<div style="height: 1.2rem;"></div>';
            return;
        }

        // Handle markdown bold/italic
        const formatted = trimmed
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>');

        // Handle lists
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            if (!inList) {
                htmlContent += '<ul class="cl-list">';
                inList = true;
            }
            htmlContent += `<li>${formatted.substring(2)}</li>`;
        } else {
            if (inList) {
                htmlContent += "</ul>";
                inList = false;
            }
            htmlContent += `<p class="cl-para">${formatted}</p>`;
        }
    });

    if (inList) htmlContent += "</ul>";

    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;800&family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet">
    <style>
        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 20mm 25mm;
            background: white;
            -webkit-font-smoothing: antialiased;
        }
        
        .letterhead {
            margin-bottom: 20mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1.5pt solid #000;
            padding-bottom: 10mm;
        }

        .user-info h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 28pt;
            font-weight: 800;
            color: #000;
            letter-spacing: -0.04em;
            line-height: 1;
            margin-bottom: 4px;
            text-transform: uppercase;
        }

        .user-info p {
            font-size: 9pt;
            font-weight: 600;
            color: #4b5563;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }

        .date-section {
            margin-bottom: 12mm;
            font-weight: 600;
            color: #111827;
            font-size: 10.5pt;
        }

        .cl-content {
            font-family: 'EB Garamond', serif;
            font-size: 13pt;
            color: #111827;
            line-height: 1.5;
        }

        .cl-para { 
            margin-bottom: 1.2rem; 
            text-align: justify;
        }
        
        .cl-list {
            margin-bottom: 1.2rem;
            padding-left: 1.2rem;
        }
        
        .cl-list li {
            margin-bottom: 0.5rem;
            text-align: justify;
        }
        
        strong { font-weight: 700; color: #000; }

        .signature {
            margin-top: 15mm;
            font-family: 'EB Garamond', serif;
            font-size: 13pt;
        }

        .signature-name {
            margin-top: 8mm;
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            font-size: 12pt;
            color: #000;
        }

        .footer {
            position: absolute;
            bottom: 15mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #9ca3af;
            font-family: 'Inter', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
    </style>
</head>
<body>
    <div class="letterhead">
        <div class="user-info">
            <h1>Applicant</h1>
            <p>Professional Candidate</p>
        </div>
        <div style="text-align: right; font-size: 8pt; color: #6b7280; font-weight: 500;">
            Generated via Zebra AI Suite<br>
            Verification ID: CL-${Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div>
    </div>

    <div class="date-section">
        ${date}
    </div>

    <div class="cl-content">
        ${htmlContent}
    </div>

    <div class="signature">
        Sincerely,<br>
        <div class="signature-name">Applicant</div>
    </div>

    <div class="footer">
        Confidential &middot; Professional Application &middot; Zebra AI
    </div>
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
