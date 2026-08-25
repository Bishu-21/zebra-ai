import type { IconType } from "react-icons";
import {
  RiArticleLine,
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiFlashlightLine,
  RiRadarLine,
  RiShieldCheckLine,
} from "react-icons/ri";

interface ComparisonFeature {
  icon: IconType;
  title: string;
  badge: string;
  zebra: string;
  typical: string;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    icon: RiShieldCheckLine,
    title: "Structured resume review",
    badge: "45 checks",
    zebra: "Content, structure, writing, evidence, and ATS-readability checks tied to a documented rubric.",
    typical: "A single opaque score with little guidance about what to improve.",
  },
  {
    icon: RiFlashlightLine,
    title: "Evidence-based rewrites",
    badge: "No invented claims",
    zebra: "Clearer achievement bullets grounded in the employers, tools, outcomes, and measurements you provide.",
    typical: "Generic text that may introduce unsupported claims or filler.",
  },
  {
    icon: RiRadarLine,
    title: "Explainable suggestions",
    badge: "Transparent",
    zebra: "A rationale for every recommendation, with approval required before your resume changes.",
    typical: "Black-box rewrites with no visible reasoning or review step.",
  },
  {
    icon: RiFileTextLine,
    title: "Live side-by-side editor",
    badge: "Live preview",
    zebra: "Edit structured content beside the rendered resume, then export a clean PDF.",
    typical: "Template forms separated from the final document preview.",
  },
  {
    icon: RiArticleLine,
    title: "Job gap analysis",
    badge: "Job-specific",
    zebra: "Compare your stated skills and experience with a supplied job description to find coverage gaps.",
    typical: "Manual prompt engineering and copy-pasting into a separate chatbot.",
  },
  {
    icon: RiCheckboxCircleLine,
    title: "Hosted portfolio",
    badge: "Shareable URL",
    zebra: "Publish selected, verified project evidence in a focused technical portfolio.",
    typical: "A static document download with no interactive project showcase.",
  },
];

export function AeoComparison() {
  return (
    <section id="compare" className="relative scroll-mt-20 overflow-hidden border-y border-border-subtle bg-white px-5 py-20 md:px-8 md:py-28">
      <div className="section-stripes" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl md:mb-14">
          <div className="mb-5 flex items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-black" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-black">How we compare</span>
          </div>
          <h2 className="mb-5 text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground md:text-6xl">
            More control than a one-click rewrite.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-accent-dark md:text-lg">
            Zebra combines structured checks, source-grounded suggestions, and your approval. Here is what that means in practice.
          </p>
        </div>

        <div className="hidden grid-cols-[1.1fr_1fr_1fr] border-b border-neutral-200 px-6 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500 md:grid">
          <span>Capability</span>
          <span className="text-foreground">Zebra AI</span>
          <span>Typical AI rewriter</span>
        </div>

        <div className="grid gap-4 pt-4">
          {COMPARISON_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="grid gap-5 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:grid-cols-[1.1fr_1fr_1fr] md:gap-8 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
                    <Icon aria-hidden="true" size={21} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">{feature.title}</h3>
                    <span className="mt-1.5 inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                      {feature.badge}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-foreground md:hidden">Zebra AI</p>
                  <p className="text-sm leading-6 text-neutral-700">{feature.zebra}</p>
                </div>
                <div className="border-t border-neutral-100 pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500 md:hidden">Typical AI rewriter</p>
                  <p className="text-sm leading-6 text-neutral-500">{feature.typical}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
