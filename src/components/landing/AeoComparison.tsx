"use client";

import React from "react";
import { m } from "framer-motion";
import { 
  RiShieldCheckLine, 
  RiFlashlightLine, 
  RiRadarLine, 
  RiFileTextLine, 
  RiArticleLine, 
  RiCheckboxCircleLine 
} from "react-icons/ri";

const COMPARISON_FEATURES = [
  {
    icon: RiShieldCheckLine,
    title: "Structured Resume Review",
    badge: "45 checks",
    description: "Reviews content, structure, writing, project evidence, and common ATS readability risks with a documented rubric.",
    contrast: "A single opaque score gives little guidance about what to improve.",
  },
  {
    icon: RiFlashlightLine,
    title: "Evidence-Based Rewrites",
    badge: "No invented claims",
    description: "Suggests clearer achievement bullets while preserving the employers, tools, outcomes, and measurements found in your source material.",
    contrast: "Unrestricted generators can add unsupported claims or generic filler.",
  },
  {
    icon: RiRadarLine,
    title: "AI Explainability & Audit",
    badge: "Transparent",
    description: "Provides a rationale for each recommendation so you can review the reasoning before changing your resume.",
    contrast: "Black-box AI rewrites with no visibility into rationale or alignment logic.",
  },
  {
    icon: RiFileTextLine,
    title: "Live Side-by-Side Editor",
    badge: "Live preview",
    description: "Shows resume edits alongside the rendered document and supports clean PDF export.",
    contrast: "Clunky template forms with slow server-side compilation delays.",
  },
  {
    icon: RiArticleLine,
    title: "Job Gap Analysis",
    badge: "Job-specific",
    description: "Compares your stated skills, projects, and work evidence with a supplied job description to identify coverage gaps.",
    contrast: "Requires manual prompt-engineering copy-pasted into external chatbots.",
  },
  {
    icon: RiCheckboxCircleLine,
    title: "1-Click Hosted Portfolio",
    badge: "Live URL",
    description: "Generates an interactive technical portfolio hosted at zebra-ai.app/p/yourname to showcase live GitHub proof.",
    contrast: "Restricted to static single-page document downloads with no web presence.",
  },
];

export function AeoComparison() {
  return (
    <section id="compare" className="pt-[120px] pb-24 px-5 md:px-8 bg-white overflow-hidden relative border-t border-border-subtle">
      <div className="section-stripes" aria-hidden="true" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Zebra Section Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="w-1.5 h-6 bg-black rounded-full" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-black">
              How We Compare
            </span>
          </m.div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.04em] leading-[1.1] mb-6 md:mb-8 text-foreground">
            What <span className="text-foreground">Zebra</span> adds
          </h2>
          <p className="text-accent-dark text-lg leading-relaxed">
            Zebra combines structured checks, source-grounded suggestions, and user approval. It helps you improve a resume without pretending to reproduce proprietary ATS systems.
          </p>
        </div>

        {/* Dashboard-Consistent Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPARISON_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <m.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="group relative flex flex-col justify-between p-7 bg-white border border-neutral-200/80 rounded-3xl hover:border-neutral-300 hover:shadow-xl active:scale-[0.99] transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-11 h-11 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Icon size={22} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl mb-2 text-foreground tracking-tight">
                    {feature.title}
                  </h3>
                  
                  <p className="text-xs md:text-sm text-neutral-600 font-normal leading-relaxed mb-4">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100">
                  <div className="text-[11px] text-neutral-400 font-medium leading-normal flex items-start gap-1.5">
                    <span className="text-neutral-400 font-bold shrink-0">vs</span>
                    <span>{feature.contrast}</span>
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
