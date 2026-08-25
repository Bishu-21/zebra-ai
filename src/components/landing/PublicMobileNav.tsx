"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RiCloseLine, RiMenuLine } from "react-icons/ri";
import { NavAuth } from "@/components/auth/NavAuth";

const SECTIONS = [
  { id: "product", label: "Product" },
  { id: "compare", label: "Compare" },
  { id: "about", label: "Story" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
] as const;

export function PublicMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-controls="mobile-navigation-menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="relative z-50 grid size-11 place-items-center rounded-xl border border-neutral-200 bg-white text-foreground shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        {isOpen ? <RiCloseLine aria-hidden="true" size={24} /> : <RiMenuLine aria-hidden="true" size={24} />}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 top-20 z-30 bg-black/20 backdrop-blur-[2px]"
            onClick={closeMenu}
          />
          <div
            id="mobile-navigation-menu"
            className="absolute inset-x-4 top-[calc(100%+0.75rem)] z-40 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-3 shadow-2xl"
          >
            <div className="flex flex-col" aria-label="Mobile navigation">
              {SECTIONS.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={closeMenu}
                  className="flex min-h-12 items-center justify-between rounded-2xl px-4 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none"
                >
                  {section.label}
                  <span aria-hidden="true" className="text-neutral-400">↘</span>
                </Link>
              ))}
            </div>
            <div className="mt-3 border-t border-neutral-100 pt-3 [&>*]:flex [&>*]:min-h-12 [&>*]:w-full [&>*]:items-center [&>*]:justify-center [&>*]:rounded-2xl">
              <NavAuth />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
