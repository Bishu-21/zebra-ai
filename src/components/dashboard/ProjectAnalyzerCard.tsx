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
        className="group/card relative overflow-hidden flex flex-col justify-between h-full min-h-[220px] cursor-pointer transition-all p-6 bg-white border border-black/[0.04] rounded-2xl hover:shadow-2xl hover:shadow-black/[0.03] active:scale-[0.99]"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.01] rounded-bl-[4rem] group-hover/card:scale-110 transition-transform" />
        <div className="flex items-start justify-between mb-8">
          <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center text-[#737373]/40 group-hover/card:bg-[#10B981] group-hover/card:text-white transition-all duration-500">
            <RiShieldCheckLine size={28} />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#737373]">Validate</span>
              <RiArrowRightSLine size={14} className="text-[#10B981]" />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-2xl mb-2 text-[#0A0A0A] tracking-tighter">Project Proof Analyzer</h3>
          <p className="text-[0.65rem] text-[#737373] font-bold uppercase tracking-[0.1em] leading-relaxed">
            Verify project links, evaluate <br/> tech stack & generate bullet points.
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
              className="relative w-full max-w-5xl max-h-[90vh] bg-[#F5F5F7] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="absolute top-8 right-8 z-[110]">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-white transition-all shadow-lg"
                >
                  <RiCloseLine size={24} />
                </button>
              </div>
              
              <div className="h-full overflow-y-auto no-scrollbar p-8 md:p-12">
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
