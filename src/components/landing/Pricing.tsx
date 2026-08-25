"use client";

import React, { useState } from "react";
import { m } from "framer-motion";
import { PLANS, PlanId } from "@/lib/constants/plans";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

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
  const router = useRouter();
  const { data: session } = useSession();
  const [loading] = useState<string | null>(null);

  const handleSubscription = async (planId: PlanId) => {
    if (!session) {
      // Trigger the Auth Modal
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }
    router.push(`/dashboard?showPricing=true&plan=${planId}`);
  };

  const planCards = [
    {
      id: "starter" as PlanId,
      name: PLANS.starter.name,
      icon: <FlashIcon />,
      price: PLANS.starter.displayPrice,
      description: "Perfect for students & single applications.",
      features: [`${PLANS.starter.credits} AI Credits`, "Resume Quality Reviews", "Job Description Matching", "PDF Resume Export"],
      cta: `Buy ${PLANS.starter.credits} Credits`,
      featured: false
    },
    {
      id: "pro" as PlanId,
      name: PLANS.pro.name,
      icon: <CrownIcon />,
      price: PLANS.pro.displayPrice,
      description: "Strategic edge for active job seekers.",
      features: [`${PLANS.pro.credits} AI Credits`, "Resume Quality Reviews", "Job Description Matching", "Cover Letter Generation"],
      cta: `Buy ${PLANS.pro.credits} Credits`,
      featured: true
    },
    {
      id: "enterprise" as PlanId,
      name: PLANS.enterprise.name,
      icon: <EnterpriseIcon />,
      price: PLANS.enterprise.displayPrice,
      description: "Full suite for career excellence.",
      features: [`${PLANS.enterprise.credits} AI Credits`, "Resume Quality Reviews", "Job Description Matching", "Cover Letter Generation"],
      cta: `Buy ${PLANS.enterprise.credits} Credits`,
      featured: false
    }
  ];

  return (
    <section id="pricing" className="pt-[100px] pb-24 px-5 md:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-5"
          >
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">One-time credit packs</span>
          </m.div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.04em] leading-[1.1] mb-5 md:mb-6 text-foreground">
            Premium Career Tools, <span className="text-primary">Localized</span>
          </h2>
          <p className="text-accent-dark text-lg leading-relaxed">
            Choose a one-time credit pack based on how many resume reviews, tailoring runs, or generated documents you expect to use.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planCards.map((plan, index) => (
            <m.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-10 pt-14 rounded-3xl border-[1.5px] transition-all duration-300 relative ${
                plan.featured
                ? "bg-white border-primary shadow-[0px_24px_60px_-15px_rgba(0,0,0,0.1)] scale-105 z-10"
                : "bg-white/60 border-black/5 hover:border-black/30"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-black/10">
                  Most Popular
                </div>
              )}
              <div className="flex items-center justify-between mb-8 mt-2">
                <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-primary">
                  {plan.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold tracking-tighter">{plan.price}</span>
                <span className="text-muted-foreground text-sm font-medium">one-time</span>
              </div>
              <p className="text-accent-dark text-sm mb-10">{plan.description}</p>

              <div className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center">
                      <CheckIcon className="text-primary" />
                    </div>
                    <span className="text-sm font-medium text-accent-dark">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscription(plan.id)}
                disabled={loading !== null}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 ${
                plan.featured
                ? "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-black/15"
                : "bg-white text-foreground border-[1.5px] border-black/10 hover:border-black/30 hover:bg-neutral-50"
              }`}>
                {loading === plan.id ? "Processing..." : plan.cta}
              </button>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
