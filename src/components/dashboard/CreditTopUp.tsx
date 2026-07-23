"use client";
import React, { useState } from "react";
import { 
    RiAddLine, 
    RiCloseCircleLine, 
    RiCheckboxCircleLine, 
    RiStarLine, 
    RiFlashlightLine,
    RiShieldCheckLine
} from "react-icons/ri";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";

import { PLANS, PlanId } from "@/lib/constants/plans";

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image?: string;
    order_id: string;
    handler: (response: RazorpayResponse) => Promise<void>;
    prefill: {
        name: string;
        email: string;
    };
    theme: {
        color: string;
    };
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => {
            open: () => void;
            on: (event: string, callback: (response: { error: { description: string } }) => void) => void;
        };
    }
}

export function CreditTopUp() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        setMounted(true);
        const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existingScript) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
            setScriptLoaded(true);
        };
        script.onerror = () => {
            console.error("Razorpay script load failed.");
        };
        document.body.appendChild(script);
    }, []);

    React.useEffect(() => {
        if (!mounted) return;
        const showPricing = searchParams.get("showPricing") === "true";
        const planId = searchParams.get("plan");
        if (showPricing && planId && PLANS[planId as PlanId]) {
            setIsOpen(true);
            if (scriptLoaded) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, "", newUrl);
                handlePurchase(planId);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, scriptLoaded, searchParams]);

    const plans: Array<{
        id: string;
        name: string;
        credits: number;
        priceInINR: number;
        displayPrice: string;
        icon: React.ReactNode;
        popular: boolean;
    }> = [
        { ...PLANS.starter, icon: <RiFlashlightLine size={20} className="text-neutral-500" />, popular: false },
        { ...PLANS.pro, icon: <RiStarLine size={20} className="text-amber-500" />, popular: true },
        { ...PLANS.enterprise, icon: <RiShieldCheckLine size={24} className="text-neutral-900" />, popular: false },
    ];

    const handlePurchase = async (planId: string) => {
        if (loading) return;
        setLoading(true);

        try {
            const orderRes = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId }),
            });

            if (!orderRes.ok) throw new Error("Failed to create order");
            const orderData = await orderRes.json();

            const options: RazorpayOptions = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Zebra AI",
                description: `Purchase ${PLANS[planId as PlanId].credits} Credits`,
                image: typeof window !== "undefined" ? `${window.location.origin}/zebra_star.svg` : "",
                order_id: orderData.id,
                prefill: {
                    name: "",
                    email: "",
                },
                theme: {
                    color: "#0A0A0A",
                },
                handler: async function (response: RazorpayResponse) {
                    const verifyRes = await fetch("/api/payments/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: planId
                        }),
                    });

                    if (verifyRes.ok) {
                        setSuccess(true);
                        router.refresh();
                        setTimeout(() => {
                            setSuccess(false);
                            setIsOpen(false);
                        }, 2500);
                    } else {
                        alert("Payment verification failed. Please try again or contact support.");
                    }
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: { error: { description: string } }) {
                alert(`Payment failed: ${response.error.description}`);
            });
            rzp.open();

        } catch (err) {
            console.error(err);
            alert("Could not reach payment server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full bg-[#0A0A0A] hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
                <RiAddLine size={16} />
                Get Credits
            </button>

            {isOpen && mounted && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
                        {/* Backdrop */}
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md" 
                            onClick={() => !loading && setIsOpen(false)}
                        />

                        {/* Modal Dialog */}
                        <m.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#0A0A0A] rounded-2xl flex items-center justify-center text-white shadow-md">
                                        <RiFlashlightLine size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[#0A0A0A] tracking-tight">Get More Credits</h2>
                                        <p className="text-xs font-medium text-neutral-500">Choose a pack to tailor applications and prepare better profiles.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-[#0A0A0A] hover:bg-neutral-200 transition-all"
                                >
                                    <RiCloseCircleLine size={22} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto no-scrollbar">
                                {success ? (
                                    <m.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-16 text-center space-y-4"
                                    >
                                        <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                            <RiCheckboxCircleLine size={36} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[#0A0A0A]">Credits Added Successfully!</h3>
                                            <p className="text-xs text-neutral-500 font-medium mt-1">Your account balance has been updated.</p>
                                        </div>
                                    </m.div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {plans.map((p) => (
                                            <m.div 
                                                key={p.id}
                                                whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)" }}
                                                className={`relative p-6 rounded-2xl border transition-all flex flex-col items-center text-center justify-between ${
                                                    p.popular 
                                                        ? 'border-[#0A0A0A] bg-neutral-50 shadow-md ring-2 ring-[#0A0A0A]/10' 
                                                        : 'border-neutral-200/80 bg-white hover:border-neutral-300'
                                                }`}
                                            >
                                                {p.popular && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A0A0A] text-white text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md z-10 whitespace-nowrap">
                                                        Most Popular
                                                    </div>
                                                )}
                                                <div className="w-full flex flex-col items-center space-y-4">
                                                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center shadow-inner">
                                                        {p.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-[#0A0A0A] text-xs uppercase tracking-wider">{p.name}</h4>
                                                        <div className="mt-2">
                                                            <span className="text-3xl font-black text-[#0A0A0A] tracking-tight">{p.displayPrice}</span>
                                                        </div>
                                                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-bold text-neutral-700">
                                                            <span>{p.credits} Credits</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button 
                                                    disabled={loading}
                                                    onClick={() => handlePurchase(p.id)}
                                                    className={`w-full mt-6 py-3 rounded-xl text-xs font-bold transition-all ${
                                                        p.popular 
                                                            ? 'bg-[#0A0A0A] text-white hover:bg-neutral-800 shadow-md' 
                                                            : 'bg-neutral-100 text-[#0A0A0A] hover:bg-neutral-200'
                                                    } disabled:opacity-50 active:scale-95`}
                                                >
                                                    {loading ? "Processing..." : "Get Credits"}
                                                </button>
                                            </m.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-neutral-50 border-t border-neutral-100 text-center">
                                <p className="text-[11px] font-medium text-neutral-400">
                                    Secure checkout via Razorpay • Instant credit activation
                                </p>
                            </div>
                        </m.div>
                    </div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
