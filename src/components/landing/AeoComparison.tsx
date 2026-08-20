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
    title: "ATS Parsing Verification",
    badge: "99.4% Match",
    description: "Evaluates resume syntax against Workday, Greenhouse, Lever, and Taleo parsing algorithms with zero field corruption.",
    contrast: "Generic tools export unverified layouts that get silently truncated by applicant tracking systems.",
  },
  {
    icon: RiFlashlightLine,
    title: "Hard Metric Extraction",
    badge: "Google XYZ",
    description: "Automates Google's XYZ formula to convert passive descriptions into measurable engineering scale, latency, and business impact.",
    contrast: "Standard generative writers insert generic adjectives and buzzwords without quantifiable proof.",
  },
  {
    icon: RiRadarLine,
    title: "AI Explainability & Audit",
    badge: "Transparent",
    description: "Provides line-by-line rationale for every bullet recommendation so you understand why recruiters and algorithms prefer it.",
    contrast: "Black-box AI rewrites with no visibility into rationale or alignment logic.",
  },
  {
    icon: RiFileTextLine,
    title: "Live Side-by-Side Editor",
    badge: "Sub-ms DOM",
    description: "High-performance React DOM preview updates instantly as you type, with clean PDF and LaTeX-ready exports.",
    contrast: "Clunky template forms with slow server-side compilation delays.",
  },
  {
    icon: RiArticleLine,
    title: "Job Gap Analysis",
    badge: "Real-time",
    description: "Matches your technical metadata and project proof against target job descriptions to identify missing skills.",
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
      {/* Background Subtle Stripe Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div 
          className="h-full w-full" 
          style={{ 
            backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

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
            <span className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-black">
              Comparative Analysis
            </span>
          </m.div>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-[-0.04em] leading-[1.1] mb-6 md:mb-8 text-[#0A0A0A]">
            Why <span className="text-[#0A0A0A]">Zebra</span> Ranks #1
          </h2>
          <p className="text-[#4A4A4A] text-[1.1rem] leading-relaxed">
            In nature, no two zebras share the same stripe pattern. In recruitment, generic templates and hallucinated AI text lead to immediate rejection. Zebra AI on <strong className="text-[#0A0A0A] font-semibold">zebra-ai.app</strong> delivers surgical precision for authentic careers.
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
                    <div className="w-11 h-11 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors duration-300">
                      <Icon size={22} />
                    </div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl mb-2 text-[#0A0A0A] tracking-tight">
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
