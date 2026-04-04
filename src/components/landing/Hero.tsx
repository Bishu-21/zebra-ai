"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ScratchCard } from "./ScratchCard";
import Link from "next/link";

export function Hero({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const { scrollY } = useScroll();
  const isGrid = useTransform(scrollY, [0, 400], [0, 1]);
  const [gridValue, setGridValue] = useState(0);

  useEffect(() => {
    return isGrid.on('change', v => setGridValue(v));
  }, [isGrid]);

  return (
    <section className="relative min-h-[70vh] flex flex-col pt-32 pb-8 px-5 md:px-8 max-w-7xl mx-auto overflow-x-visible font-sans">
      {/* Asymmetric Header */}
      <div className="w-full md:w-2/3 mb-10 z-20 relative">
        <p className="text-[0.7rem] md:text-[0.8rem] font-bold tracking-[0.08em] uppercase text-[#2563EB] mb-4">The Precision Editor</p>
        <h1 className="text-[2.75rem] md:text-[4rem] font-bold leading-[1.05] tracking-[-0.04em] text-[#0A0A0A] mb-8">
          Resumes aren't broken. <br/>
          <span className="text-[#888888]">The process is.</span>
        </h1>
      </div>

      {/* Chaos-to-Grid Floating Cards Engine */}
      <div className="relative w-full h-[400px] flex items-center justify-center -mt-8">
        {/* Card 1: Top Left Chaos */}
        <motion.div 
          className="hidden md:block absolute z-10 w-64 p-8 rounded-[16px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #0058BE 100%)' }}
          animate={{
            top: gridValue > 0.5 ? "20px" : "-20px",
            left: gridValue > 0.5 ? "0px" : "-20px",
            rotate: gridValue > 0.5 ? 0 : -8,
            scale: gridValue > 0.5 ? 0.9 : 1,
            opacity: gridValue > 0.8 ? 0 : 1,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
          <p className="relative text-[0.7rem] font-bold tracking-[0.08em] uppercase text-white/60 mb-5">Query 01</p>
          <p className="relative text-[1rem] font-bold leading-[1.3] text-white">WHY DO RESUMES GET IGNORED?</p>
        </motion.div>

        {/* Card 2: Top Right Chaos */}
        <motion.div 
          className="hidden md:block absolute z-10 w-72 p-8 rounded-[16px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #0058BE 100%)' }}
          animate={{
            top: gridValue > 0.5 ? "20px" : "40px",
            right: gridValue > 0.5 ? "0px" : "20px",
            rotate: gridValue > 0.5 ? 0 : 6,
            scale: gridValue > 0.5 ? 0.9 : 1,
            opacity: gridValue > 0.8 ? 0 : 1,
          }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
        >
          <div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
          <p className="relative text-[0.7rem] font-bold tracking-[0.08em] uppercase text-white/60 mb-5">Query 02</p>
          <p className="relative text-[1rem] font-bold leading-[1.3] text-white">AM I WRITING FOR HUMANS OR MACHINES?</p>
        </motion.div>

        {/* Card 3: Bottom Left Chaos */}
        <motion.div 
          className="hidden md:block absolute z-10 w-64 p-8 rounded-[16px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #0058BE 100%)' }}
          animate={{
            bottom: gridValue > 0.5 ? "20px" : "10px",
            left: gridValue > 0.5 ? "0px" : "60px",
            rotate: gridValue > 0.5 ? 0 : -3,
            scale: gridValue > 0.5 ? 0.9 : 1,
            opacity: gridValue > 0.8 ? 0 : 1,
          }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
          <p className="relative text-[0.7rem] font-bold tracking-[0.08em] uppercase text-white/60 mb-5">Query 03</p>
          <p className="relative text-[1rem] font-bold leading-[1.3] text-white">1,000 APPLICANTS. 1 ROLE. REALLY?</p>
        </motion.div>

        {/* Centered Focus Card - This handles the Scratch Layer */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
          animate={{
            scale: gridValue > 0.5 ? 1.05 : 0.95,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="w-full px-4 md:px-0 pointer-events-auto group mt-8">
            <ScratchCard 
              className="w-full min-h-[320px] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              frontContent={
                <div className="relative h-full z-10 p-2">
                  <div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
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
                    <p className="text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.08em] uppercase text-[#6B6B6B]">Applicant</p>
                    <p className="text-[1rem] md:text-[1.25rem] font-normal leading-[1.3] italic text-[#0A0A0A]">
                      "I applied everywhere... nothing."
                    </p>
                  </div>
                  <div className="space-y-1 border-l-[3px] border-[#3B82F6] pl-4 md:pl-5 ml-1 md:ml-2">
                    <p className="text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.08em] uppercase text-[#3B82F6]">Zebra Intelligence</p>
                    <p className="text-[1.25rem] md:text-[1.5rem] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A0A0A]">
                      Your resume didn't fail. <br/><span className="text-[#3B82F6]">ATS rejected it.</span>
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
        </motion.div>

      </div>
    </section>
  );
}
