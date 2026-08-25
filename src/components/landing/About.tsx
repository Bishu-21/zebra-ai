"use client";

import React from "react";
import { m } from "framer-motion";

const FocusIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ShieldIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const GlobalIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export function About() {
  return (
    <section id="about" className="pt-[120px] pb-24 px-5 md:px-8 bg-white overflow-hidden relative">
      <div className="section-stripes" aria-hidden="true" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-2xl mb-12 md:mb-20">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="w-1.5 h-6 bg-black rounded-full" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-black">Why Zebra</span>
          </m.div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.04em] leading-[1.1] mb-6 md:mb-8 text-foreground">
            Why <span className="text-foreground">Zebra</span>?
          </h2>
          <p className="text-accent-dark text-lg leading-relaxed">
            Every candidate has different evidence: coursework, projects, freelance work, internships, or professional experience. Zebra adapts its review to that context and helps present real work clearly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-6 group"
          >
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-300">
              <FocusIcon />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Detailed Analysis</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Review resume structure, skills, projects, and work evidence against clear criteria and a specific role when you provide one.
            </p>
          </m.div>

          <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6 group"
          >
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-300">
              <ShieldIcon />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Evidence First</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Suggested changes stay grounded in your source material. You can inspect, edit, approve, or reject recommendations before they affect a tailored resume.
            </p>
          </m.div>

          <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-6 group"
          >
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-300">
              <GlobalIcon />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Different Career Stages</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Student, freelancer, and professional profiles use different expectations, so missing employment does not unfairly penalize an early-career resume.
            </p>
          </m.div>
        </div>
      </div>
    </section>
  );
}


