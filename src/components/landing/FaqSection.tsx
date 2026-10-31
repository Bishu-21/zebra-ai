"use client";

import React, { useState } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { FAQ_ITEMS } from "@/data/faq";
import { RiQuestionLine, RiAddLine, RiSubtractLine } from "react-icons/ri";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="pt-[120px] pb-24 px-5 md:px-8 bg-white overflow-hidden relative border-t border-border-subtle">
      <div className="section-stripes" aria-hidden="true" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Zebra Section Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <m.div
            initial={reduceMotion ? false : { opacity: 0, x: -20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="w-1.5 h-6 bg-black rounded-full" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-black">
              Questions & Answers
            </span>
          </m.div>
          
          <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.04em] leading-[1.1] mb-6 md:mb-8 text-foreground">
            Credits, imports, and export.
          </h2>
          
          <p className="text-accent-dark text-lg leading-relaxed">
            Short answers about what Zebra reviews, how credits work, and what you can export.
          </p>
        </div>

        {/* Dashboard-Consistent FAQ List */}
        <div className="max-w-4xl space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <m.div
                key={idx}
                initial={reduceMotion ? false : { opacity: 0, y: 15 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : idx * 0.04 }}
                className={`group transition-all duration-300 bg-white border rounded-3xl p-6 md:p-7 shadow-xs ${
                  isOpen
                    ? "border-neutral-300 shadow-md"
                    : "border-neutral-200/80 hover:border-neutral-300"
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left flex items-start justify-between gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                      isOpen
                        ? "bg-primary text-white"
                        : "bg-neutral-100 text-neutral-600 group-hover:bg-primary group-hover:text-white"
                    }`}>
                      <RiQuestionLine size={20} />
                    </div>
                    <div className="pt-2">
                      <h3 className="font-bold text-lg md:text-xl text-foreground tracking-tight leading-snug">
                        {item.question}
                      </h3>
                    </div>
                  </div>
                  
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 transition-colors ${
                    isOpen ? "bg-neutral-100 text-foreground" : "bg-neutral-50 text-neutral-400 group-hover:text-foreground"
                  }`}>
                    {isOpen ? <RiSubtractLine size={18} /> : <RiAddLine size={18} />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeInOut" }}
                    >
                      <div className="pl-15 pr-4 pt-4 mt-4 border-t border-neutral-100">
                        <p className="text-xs md:text-sm text-neutral-600 font-normal leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
