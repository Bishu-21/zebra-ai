import { Fragment, type ReactNode } from "react";

interface SafeMarkdownProps {
    content: string;
    className?: string;
}

function inlineContent(value: string, keyPrefix: string): ReactNode[] {
    const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.filter(Boolean).map((part, index) => {
        const key = `${keyPrefix}-${index}`;
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={key} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code key={key} className="rounded bg-background/80 px-1 py-0.5 font-mono text-[0.9em] text-foreground">
                    {part.slice(1, -1)}
                </code>
            );
        }
        return <Fragment key={key}>{part}</Fragment>;
    });
}

/** Render the small Markdown subset used by AI replies without injecting HTML. */
export function SafeMarkdown({ content, className = "" }: SafeMarkdownProps) {
    const normalized = content
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+(#{1,3})[ \t]+/g, "\n$1 ")
        .replace(/[ \t]+-[ \t]+(?=\*\*)/g, "\n- ")
        .trim();
    const lines = normalized.split("\n");
    const blocks: ReactNode[] = [];

    for (let index = 0; index < lines.length;) {
        const line = lines[index].trim();
        if (!line) {
            index += 1;
            continue;
        }

        const heading = /^(#{1,3})\s+(.+)$/.exec(line);
        if (heading) {
            const level = heading[1].length;
            blocks.push(
                <div
                    key={`heading-${index}`}
                    className={level === 1 ? "text-base font-extrabold" : "text-sm font-extrabold"}
                >
                    {inlineContent(heading[2], `heading-${index}`)}
                </div>,
            );
            index += 1;
            continue;
        }

        const unordered = /^[-*]\s+(.+)$/.exec(line);
        if (unordered) {
            const items: ReactNode[] = [];
            while (index < lines.length) {
                const item = /^[-*]\s+(.+)$/.exec(lines[index].trim());
                if (!item) break;
                items.push(<li key={`bullet-${index}`}>{inlineContent(item[1], `bullet-${index}`)}</li>);
                index += 1;
            }
            blocks.push(<ul key={`list-${index}`} className="list-disc space-y-1 pl-5">{items}</ul>);
            continue;
        }

        const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
        if (ordered) {
            const items: ReactNode[] = [];
            while (index < lines.length) {
                const item = /^\d+[.)]\s+(.+)$/.exec(lines[index].trim());
                if (!item) break;
                items.push(<li key={`number-${index}`}>{inlineContent(item[1], `number-${index}`)}</li>);
                index += 1;
            }
            blocks.push(<ol key={`ordered-${index}`} className="list-decimal space-y-1 pl-5">{items}</ol>);
            continue;
        }

        const paragraph: string[] = [line];
        index += 1;
        while (index < lines.length) {
            const next = lines[index].trim();
            if (!next || /^(?:#{1,3}\s+|[-*]\s+|\d+[.)]\s+)/.test(next)) break;
            paragraph.push(next);
            index += 1;
        }
        blocks.push(
            <p key={`paragraph-${index}`} className="whitespace-pre-wrap">
                {inlineContent(paragraph.join(" "), `paragraph-${index}`)}
            </p>,
        );
    }

    return <div className={`space-y-2 break-words leading-6 ${className}`}>{blocks}</div>;
}
