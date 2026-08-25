"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface SectionItem {
  id: string;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: "product", label: "Product" },
  { id: "compare", label: "Compare" },
  { id: "about", label: "Story" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

export function PublicMobileNav() {
  const [activeSection, setActiveSection] = useState<string>("product");
  const [isNearFooter, setIsNearFooter] = useState(false);

  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const sectionObserver = new IntersectionObserver(observerCallback, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.1,
    });

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    const footerEl = document.querySelector("footer");
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsNearFooter(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (footerEl) footerObserver.observe(footerEl);

    return () => {
      sectionObserver.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  if (isNearFooter) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[94vw] bg-white/80 backdrop-blur-xl rounded-full border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-2 py-1.5 transition-all duration-300"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)",
      }}
    >
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <Link
              key={section.id}
              href={`#${section.id}`}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "text-neutral-500 hover:text-foreground hover:bg-neutral-100/60"
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
