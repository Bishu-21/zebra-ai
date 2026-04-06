"use client";

import React from "react";
import { m } from "framer-motion";

const CheckIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FlashIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const CrownIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20" />
    <path d="M20 17l-5-12-3 4-3-4-5 12h16z" />
  </svg>
);

const EnterpriseIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
    <path d="M7 2h0" />
    <path d="M17 2h0" />
    <path d="M2 7h20" />
    <path d="M2 17h20" />
  </svg>
);

export function Pricing() {
  const plans = [
    {
      name: "Free",
      icon: <FlashIcon />,
      price: "$0",
      description: "Basic audit for aspiring talents.",
      features: ["10 Trial Credits", "Standard Optimization", "Single Language", "Community Support"],
      cta: "Get Started",
      featured: false
    },
    {
      name: "Pro",
      icon: <CrownIcon />,
      price: "$19",
      description: "Surgical precision for career growth.",
      features: ["100 Monthly Credits", "Technical AI Audit", "Universal Translate", "Priority Support"],
      cta: "Upgrade to Pro",
      featured: true
    },
    {
      name: "Enterprise",
      icon: <EnterpriseIcon />,
      price: "Custom",
      description: "XaaS solutions for global teams.",
      features: ["Unlimited Credits", "API Integration", "Full White Label", "Dedicated Concierge"],
      cta: "Contact Sales",
      featured: false
    }
  ];

  return (
    <section id="pricing" className="py-20 px-5 md:px-8 bg-[#FDFDFD]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-20 max-w-2xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#2563EB]">The Economic Model</span>
          </m.div>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-[-0.04em] leading-[1.1] mb-6 md:mb-8 text-[#0A0A0A]">
            Built on <span className="text-[#3B82F6]">XaaS</span> Principles
          </h2>
          <p className="text-[#525252] text-[1.1rem] leading-relaxed">
            In an era where <span className="font-bold text-[#0A0A0A]">68% of companies</span> are transitioning to service-driven 
            operations, Zebra provides career agility through an everything-as-a-service economic model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <m.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-10 rounded-[28px] border-[1.5px] transition-all duration-300 relative ${
                plan.featured 
                ? "bg-white border-[#3B82F6] shadow-[0px_24px_60px_-15px_rgba(59,130,246,0.15)] scale-105 z-10" 
                : "bg-white/60 border-black/5 hover:border-[#3B82F6]/30"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#3B82F6] text-white text-[0.6rem] font-bold uppercase tracking-wider rounded-b-xl">
                  Most Popular
                </div>
              )}
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6]">
                  {plan.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold tracking-tighter">{plan.price}</span>
                <span className="text-[#737373] text-sm font-medium">{plan.name !== "Enterprise" ? "/ month" : ""}</span>
              </div>
              <p className="text-[#737373] text-sm mb-10">{plan.description}</p>
              
              <div className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#3B82F615] flex items-center justify-center">
                      <CheckIcon className="text-[#3B82F6]" />
                    </div>
                    <span className="text-sm font-medium text-[#4A4A4A]">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] ${
                plan.featured 
                ? "bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-blue-500/20" 
                : "bg-white border border-[#EAEAEA] text-[#0A0A0A] hover:border-[#3B82F6] hover:text-[#3B82F6]"
              }`}>
                {plan.cta}
              </button>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}


