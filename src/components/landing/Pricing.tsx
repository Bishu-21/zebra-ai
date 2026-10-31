"use client";

import React, { useState } from "react";
import { m, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();
  const [loading] = useState<string | null>(null);
  const [checkoutAvailable, setCheckoutAvailable] = useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/payments/status")
      .then((response) => response.json())
      .then((body: { checkoutAvailable?: boolean }) => {
        if (!cancelled) setCheckoutAvailable(body.checkoutAvailable === true);
      })
      .catch(() => {
        if (!cancelled) setCheckoutAvailable(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubscription = async (planId: PlanId) => {
    if (!session) {
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }
    if (!checkoutAvailable) return;
    router.push(`/dashboard?showPricing=true&plan=${planId}`);
  };

  const planCards = [
    {
      id: "starter" as PlanId,
      name: PLANS.starter.name,
      icon: <FlashIcon />,
      price: PLANS.starter.displayPrice,
      description: "For occasional resume reviews and applications.",
      features: [`${PLANS.starter.credits} AI Credits`, "Resume Quality Reviews", "Job Description Matching", "PDF Resume Export"],
      cta: `Buy ${PLANS.starter.credits} Credits`,
      featured: false
    },
    {
      id: "pro" as PlanId,
      name: PLANS.pro.name,
      icon: <CrownIcon />,
      price: PLANS.pro.displayPrice,
      description: "For reviewing and tailoring multiple applications.",
      features: [`${PLANS.pro.credits} AI Credits`, "Resume Quality Reviews", "Job Description Matching", "Cover Letter Generation"],
      cta: `Buy ${PLANS.pro.credits} Credits`,
      featured: true
    },
    {
      id: "enterprise" as PlanId,
      name: PLANS.enterprise.name,
      icon: <EnterpriseIcon />,
      price: PLANS.enterprise.displayPrice,
      description: "For frequent reviews, tailoring, and cover letters.",
      features: [`${PLANS.enterprise.credits} AI Credits`, "Resume Quality Reviews", "Job Description Matching", "Cover Letter Generation"],
      cta: `Buy ${PLANS.enterprise.credits} Credits`,
      featured: false
    }
  ];

  return (
    <section id="pricing" className="overflow-x-clip bg-background px-4 pb-16 pt-16 sm:px-5 sm:pb-24 sm:pt-24 md:px-8 lg:pt-[100px]">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-16">
          <m.div
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-5"
          >
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary">One-time credit packs</span>
          </m.div>
          <h2 className="mb-5 text-3xl font-bold leading-[1.1] tracking-[-0.04em] text-foreground sm:text-4xl md:mb-6 lg:text-6xl">
            Choose a credit pack
          </h2>
          <p className="text-base leading-relaxed text-accent-dark sm:text-lg">
            One-time packs for reviews, job matching, cover letters, and LinkedIn drafts. Saving a resume and exporting a PDF do not use a credit. Credits are not a subscription.
          </p>
          {checkoutAvailable === false ? (
            <p className="mt-4 text-sm text-amber-800">Checkout is not available on this environment. You can still sign in and use credits already on your account.</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {planCards.map((plan, index) => (
            <m.div
              key={plan.name}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: reduceMotion ? 0 : index * 0.1 }}
              className={`relative rounded-3xl border-[1.5px] p-6 pt-14 transition-all duration-300 sm:p-8 sm:pt-14 lg:p-10 lg:pt-14 ${
                plan.featured
                ? "z-10 border-primary bg-white shadow-[0px_24px_60px_-15px_rgba(0,0,0,0.1)]"
                : "border-black/5 bg-white/60 hover:border-black/30"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-black/10">
                  Featured pack
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
                disabled={loading !== null || (Boolean(session) && checkoutAvailable === false)}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 ${
                plan.featured
                ? "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-black/15"
                : "bg-white text-foreground border-[1.5px] border-black/10 hover:border-black/30 hover:bg-neutral-50"
              }`}>
                {loading === plan.id ? "Processing..." : !session ? "Sign in to buy" : checkoutAvailable === false ? "Checkout unavailable" : plan.cta}
              </button>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
