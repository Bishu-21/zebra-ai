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
    <section id="about" className="py-20 px-5 md:px-8 bg-white overflow-hidden relative">
      {/* Background Subtle Stripe Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="h-full w-full" style={{ 
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-2xl mb-12 md:mb-20">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="w-1.5 h-6 bg-black rounded-full" />
            <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#737373]">The Manifesto</span>
          </m.div>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-[-0.04em] leading-[1.1] mb-6 md:mb-8 text-[#0A0A0A]">
            Why <span className="text-[#3B82F6]">Zebra</span>?
          </h2>
          <p className="text-[#525252] text-[1.15rem] leading-relaxed">
            In nature, no two zebras share the same stripe pattern. They are unique by design. 
            In the modern recruitment industry, most applicants are forced into generic templates, resulting in "artificial" applications that recruiters find off-putting. 
            We are here to end the era of the generic horse.
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
            <div className="w-14 h-14 bg-[#F6F3F2] rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-300">
              <FocusIcon />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Surgical Precision</h3>
            <p className="text-[#737373] text-[0.95rem] leading-relaxed">
              We focus on substance over formatting. Zebra audits your technical metadata to align your concrete proof of work with specific, high-intent roles.
            </p>
          </m.div>

          <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6 group"
          >
            <div className="w-14 h-14 bg-[#F6F3F2] rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-300">
              <ShieldIcon />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Integrity Assured</h3>
            <p className="text-[#737373] text-[0.95rem] leading-relaxed">
              Recruiters are seeing a "quiet funeral" of integrity due to low-effort AI copy. Zebra provides transparency logs, ensuring your intelligence is reflected, not replaced.
            </p>
          </m.div>

          <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-6 group"
          >
            <div className="w-14 h-14 bg-[#F6F3F2] rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-300">
              <GlobalIcon />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Universal Access</h3>
            <p className="text-[#737373] text-[0.95rem] leading-relaxed">
              One profile. Multiple languages. Global reach. Translate your entire portfolio in seconds to break boundaries and apply anywhere in the world.
            </p>
          </m.div>
        </div>
      </div>
    </section>
  );
}


