"use client";

import { sanitizeHtml } from "@/lib/utils";
import {
    composeCoverLetterDocument,
    splitCoverLetterEnding,
    type CoverLetterBlock,
} from "@/lib/cover-letter-document";

function renderBlocks(blocks: CoverLetterBlock[]) {
    return blocks.map((block, index) => {
        if (block.type === "blank") {
            return <div key={index} className="h-4 sm:h-5" />;
        }
        if (block.type === "list") {
            return (
                <ul key={index} className="mb-4 ml-5 list-disc space-y-2 text-neutral-900">
                    {block.items.map((item, itemIndex) => (
                        <li
                            key={`${index}-${itemIndex}`}
                            className="text-left sm:text-justify leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }}
                        />
                    ))}
                </ul>
            );
        }
        return (
            <p
                key={index}
                className="mb-4 text-left sm:text-justify leading-relaxed text-neutral-900"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
            />
        );
    });
}

export function CoverLetterDocument({
    content,
    candidateName,
    className = "",
}: {
    content: string;
    candidateName?: string;
    className?: string;
}) {
    const model = composeCoverLetterDocument(content, { candidateName });
    const parts = splitCoverLetterEnding(model.blocks, Boolean(model.appendedClosing));

    return (
        <article
            className={`bg-white text-neutral-950 ${className}`}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
            {model.letterheadName ? (
                <header className="mb-8 sm:mb-10 pb-4 border-b border-neutral-950">
                    <h1 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 break-words">
                        {model.letterheadName}
                    </h1>
                </header>
            ) : null}
            <div className="text-sm sm:text-base leading-relaxed">{renderBlocks(parts.body)}</div>
            <div className="break-inside-avoid text-sm sm:text-base leading-relaxed">
                {renderBlocks(parts.ending)}
                {model.appendedClosing ? (
                    <div className="mt-10">
                        <p className="mb-6">{model.appendedClosing.greeting}</p>
                        <p className="font-sans font-bold text-neutral-950 break-words">{model.appendedClosing.name}</p>
                    </div>
                ) : null}
            </div>
        </article>
    );
}
