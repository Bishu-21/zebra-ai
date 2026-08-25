"use client";

import { useEffect, useRef } from "react";

const focusableSelector = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function useDialogFocus(open: boolean, onClose: () => void) {
    const dialogRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const dialog = dialogRef.current;
        const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
        window.requestAnimationFrame(() => focusables()[0]?.focus());

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== "Tab") return;
            const items = focusables();
            if (!items.length) return;
            const first = items[0];
            const last = items.at(-1)!;
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            previouslyFocused?.focus();
        };
    }, [onClose, open]);

    return dialogRef;
}
