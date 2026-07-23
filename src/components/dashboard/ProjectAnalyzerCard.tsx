"use client";

import React, { useState } from "react";
import { RiShieldCheckLine, RiArrowRightSLine, RiCloseLine } from "react-icons/ri";
import { ProjectProofAnalyzer } from "./ProjectProofAnalyzer";
import { m, AnimatePresence } from "framer-motion";

export function ProjectAnalyzerCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="group/card relative overflow-hidden flex flex-col justify-between h-full min-h-[200px] cursor-pointer transition-all p-7 bg-white border border-neutral-200/80 rounded-3xl hover:border-neutral-300 hover:shadow-xl active:scale-[0.99] group shadow-xs"
      >
        <div className="flex items-start justify-between mb-8">
          <div className="w-11 h-11 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 group-hover/card:bg-[#0A0A0A] group-hover/card:text-white transition-colors duration-300">
            <RiShieldCheckLine size={22} />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="text-xs font-semibold text-neutral-500">Check Proof</span>
              <RiArrowRightSLine size={16} className="text-[#0A0A0A]" />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-xl mb-1.5 text-[#0A0A0A] tracking-tight">Check My Project</h3>
          <p className="text-xs text-neutral-500 font-normal leading-relaxed">
            Analyze repository code & verify project proof points.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#F5F5F7] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="absolute top-8 right-8 z-[110]">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-white transition-all shadow-lg"
                >
                  <RiCloseLine size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                <div className="mb-12">
                    <h2 className="text-4xl font-bold tracking-tighter text-black mb-4">Project Proof Analyzer</h2>
                    <p className="text-black/50 text-sm max-w-xl leading-relaxed">
                        Provide a link to your GitHub repository or live demo. We&apos;ll analyze the technical depth, quality, and evidence to generate high-impact resume bullet points.
                    </p>
                </div>
                
                <ProjectProofAnalyzer />
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
