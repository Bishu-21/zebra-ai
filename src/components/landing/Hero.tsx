"use client";

import React from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { ScratchCard } from "./ScratchCard";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export function Hero() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  
  const { scrollY } = useScroll();

  // Transform values for Card 1
  const card1Top = useTransform(scrollY, [0, 400], ["-10px", "20px"]);
  const card1Left = useTransform(scrollY, [0, 400], ["-40px", "-10px"]);
  const card1Rotate = useTransform(scrollY, [0, 400], [-8, 0]);
  const card1Scale = useTransform(scrollY, [0, 400], [1, 0.9]);
  const card1Opacity = useTransform(scrollY, [400, 600], [1, 0]);

  // Transform values for Card 2
  const card2Top = useTransform(scrollY, [0, 400], ["0px", "30px"]);
  const card2Right = useTransform(scrollY, [0, 400], ["-40px", "-10px"]);
  const card2Rotate = useTransform(scrollY, [0, 400], [6, 0]);
  const card2Scale = useTransform(scrollY, [0, 400], [1, 0.9]);
  const card2Opacity = useTransform(scrollY, [400, 600], [1, 0]);

  // Transform values for Card 3
  const card3Bottom = useTransform(scrollY, [0, 400], ["10px", "20px"]);
  const card3Left = useTransform(scrollY, [0, 400], ["60px", "0px"]);
  const card3Rotate = useTransform(scrollY, [0, 400], [-3, 0]);
  const card3Scale = useTransform(scrollY, [0, 400], [1, 0.9]);
  const card3Opacity = useTransform(scrollY, [400, 600], [1, 0]);

  // Transform values for Focus Card
  const focusScale = useTransform(scrollY, [0, 400], [0.95, 1.05]);

  return (
    <section className="relative min-h-[70vh] flex flex-col pt-20 md:pt-28 pb-12 px-5 md:px-8 max-w-7xl mx-auto overflow-x-visible font-sans">
      {/* Asymmetric Header */}
      <div className="w-full md:w-2/3 mb-6 md:mb-10 z-20 relative">
        <p className="text-[0.75rem] md:text-[0.8rem] font-bold tracking-[0.12em] uppercase text-primary mb-4 md:mb-6">The Precision Editor</p>
        <h1 className="text-[3.5rem] md:text-[5.5rem] font-bold leading-[0.95] tracking-[-0.06em] text-foreground mb-4 md:mb-6">
          Resumes aren&apos;t broken. <br/>
          <span className="text-accent-gray">The process is.</span>
        </h1>
      </div>

      {/* Floating Cards Engine - Cleaned of vibe labels */}
      <div className="relative w-full h-[380px] flex items-center justify-center mt-4">
        {/* Card 1: Top Left */}
        <m.div 
          className="hidden lg:block absolute z-10 w-72 p-10 rounded-[24px] overflow-hidden shadow-xl"
          style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            top: card1Top,
            left: card1Left,
            rotate: card1Rotate,
            scale: card1Scale,
            opacity: card1Opacity,
          }}
        >
          <p className="relative text-[1.15rem] font-bold leading-[1.3] text-white">WHY DO RESUMES GET IGNORED?</p>
        </m.div>

        {/* Card 2: Top Right */}
        <m.div 
          className="hidden lg:block absolute z-10 w-80 p-10 rounded-[24px] overflow-hidden shadow-xl"
          style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            top: card2Top,
            right: card2Right,
            rotate: card2Rotate,
            scale: card2Scale,
            opacity: card2Opacity,
          }}
        >
          <p className="relative text-[1.15rem] font-bold leading-[1.3] text-white">AM I WRITING FOR HUMANS OR MACHINES?</p>
        </m.div>

        {/* Card 3: Bottom Left */}
        <m.div 
          className="hidden lg:block absolute z-10 w-72 p-10 rounded-[24px] overflow-hidden shadow-xl"
          style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            bottom: card3Bottom,
            left: card3Left,
            rotate: card3Rotate,
            scale: card3Scale,
            opacity: card3Opacity,
          }}
        >
          <p className="relative text-[1.15rem] font-bold leading-[1.3] text-white">1,000 APPLICANTS. 1 ROLE. REALLY?</p>
        </m.div>

        {/* Centered Focus Card - This handles the Scratch Layer */}
        <m.div 
          className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
          style={{
            scale: focusScale,
          }}
        >
          <div className="w-full px-4 md:px-0 pointer-events-auto group">
            <ScratchCard 
              className="w-full min-h-[300px] md:min-h-[320px] transition-transform duration-500 ease-out group-hover:scale-[1.01]"
              frontContent={
                <div className="relative h-full z-10 p-2">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                       style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
                  <p className="text-[0.65rem] md:text-[0.75rem] font-bold tracking-[0.08em] uppercase text-white/70 mb-2 md:mb-4">The True Insight</p>
                  <h2 className="text-[1.5rem] md:text-[2rem] font-bold leading-[1.1] max-w-xs mt-2">Scratch to reveal reality.</h2>
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 md:gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-[16px] md:h-[16px]"><path d="M11 14h1v4h-1z"/><path d="M12 2v2"/><path d="M12 6v2"/><path d="M12 10v2"/><path d="M18.36 5.64l-1.41 1.41"/><path d="M5.64 18.36l-1.41 1.41"/><path d="M22 12h-2"/><path d="M6 12H4"/><path d="M18.36 18.36l-1.41-1.41"/><path d="M5.64 5.64L4.23 4.23"/></svg>
                    </div>
                    <p className="text-white/80 text-[0.7rem] md:text-[0.8rem] font-medium tracking-wide">Drag to reveal</p>
                  </div>
                </div>
              }
              backContent={
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-1">
                    <p className="text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.08em] uppercase text-[#737373]">Applicant</p>
                    <p className="text-[1.1rem] md:text-[1.3rem] font-bold leading-[1.2] text-primary">
                      &quot;I applied everywhere... nothing.&quot;
                    </p>
                  </div>
                  <div className="space-y-1 border-l-[3px] border-[#3B82F6] pl-4 md:pl-5 ml-1 md:ml-2">
                    <p className="text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.08em] uppercase text-[#3B82F6]">Zebra Intelligence</p>
                    <p className="text-[1.25rem] md:text-[1.5rem] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A0A0A]">
                      Your resume didn&apos;t fail. <br/><span className="text-[#3B82F6]">ATS rejected it.</span>
                    </p>
                  </div>
                  <div className="pt-2 md:pt-4 flex justify-start">
                    {isLoggedIn ? (
                      <Link 
                        href="/dashboard"
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-[8px] text-[0.7rem] md:text-[0.75rem] font-bold tracking-[0.08em] uppercase hover:-translate-y-[2px] transition-all duration-200 shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                      >
                        Go to Dashboard
                      </Link>
                    ) : (
                      <button 
                        onClick={() => window.dispatchEvent(new Event("open-auth"))}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-[8px] text-[0.7rem] md:text-[0.75rem] font-bold tracking-[0.08em] uppercase hover:-translate-y-[2px] transition-all duration-200 shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                      >
                        Fix with Zebra AI
                      </button>
                    )}
                  </div>
                </div>
              }
            />
          </div>
        </m.div>

      </div>
    </section>
  );
}
