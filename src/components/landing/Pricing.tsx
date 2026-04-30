"use client";

import React, { useState } from "react";
import { m } from "framer-motion";
import { PLANS, PlanId } from "@/lib/constants/plans";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

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
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscription = async (planId: PlanId) => {
    setLoading(planId);
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }
        throw new Error(data.error || "Failed to initiate payment");
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Zebra AI",
        description: `Upgrade to ${PLANS[planId].name}`,
        order_id: data.id,
        handler: function () {
          showToast("Payment successful! Credits added.");
          router.push("/dashboard");
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Payment failed", "error");
    } finally {
      setLoading(null);
    }
  };

  const planCards = [
    {
      id: "starter" as PlanId,
      name: PLANS.starter.name,
      icon: <FlashIcon />,
      price: PLANS.starter.displayPrice,
      description: "Perfect for students & single applications.",
      features: [`${PLANS.starter.credits} AI Scan Credits`, "ATS Score Optimization", "Resume Templates", "Community Support"],
      cta: "Get Started",
      featured: false
    },
    {
      id: "pro" as PlanId,
      name: PLANS.pro.name,
      icon: <CrownIcon />,
      price: PLANS.pro.displayPrice,
      description: "Strategic edge for active job seekers.",
      features: [`${PLANS.pro.credits} Monthly Credits`, "Deep AI Resume Audit", "Job Description Matching", "Priority Support"],
      cta: "Go Pro",
      featured: true
    },
    {
      id: "enterprise" as PlanId,
      name: PLANS.enterprise.name,
      icon: <EnterpriseIcon />,
      price: PLANS.enterprise.displayPrice,
      description: "Full suite for career excellence.",
      features: [`${PLANS.enterprise.credits} Bulk Credits`, "All Pro Features", "Universal Translate", "Dedicated Mentorship"],
      cta: "Get Elite",
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
            <span className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-primary">Student-First Model</span>
          </m.div>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-[-0.04em] leading-[1.1] mb-5 md:mb-6 text-[#0A0A0A]">
            Premium Career Tools, <span className="text-primary">Localized</span>
          </h2>
          <p className="text-[#4A4A4A] text-[1.1rem] leading-relaxed">
            We believe career growth shouldn&apos;t break the bank. Our pricing is tailored for the <span className="font-bold text-[#0A0A0A]">Indian job market</span>, starting at just the price of a coffee.
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
              className={`p-10 pt-14 rounded-[28px] border-[1.5px] transition-all duration-300 relative ${
                plan.featured 
                ? "bg-white border-primary shadow-[0px_24px_60px_-15px_rgba(59,130,246,0.15)] scale-105 z-10" 
                : "bg-white/60 border-black/5 hover:border-primary/30"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-[0.65rem] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-blue-500/20">
                  Most Popular
                </div>
              )}
              <div className="flex items-center justify-between mb-8 mt-2">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  {plan.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-extrabold tracking-tighter">{plan.price}</span>
                <span className="text-[#737373] text-sm font-medium">/ pack</span>
              </div>
              <p className="text-[#4A4A4A] text-sm mb-10">{plan.description}</p>
              
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

              <button 
                onClick={() => handleSubscription(plan.id)}
                disabled={loading !== null}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 ${
                plan.featured 
                ? "bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-blue-500/20" 
                : "bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] hover:bg-transparent hover:text-[#0A0A0A]"
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




