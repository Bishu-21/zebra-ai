"use client";

import { RiAddLine } from "react-icons/ri";

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full h-10 border border-dashed border-border-subtle rounded-[var(--radius-md)] flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-semibold hover:border-primary/30 hover:text-primary transition-all">
            <RiAddLine size={12} /> {label}
        </button>
    );
}
