"use client";
import React, { useState } from "react";
import {
    RiAddLine,
    RiCloseLine,
    RiCheckboxCircleLine,
    RiStarLine,
    RiFlashlightLine,
    RiShieldCheckLine
} from "react-icons/ri";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";

import { PLANS, PlanId } from "@/lib/constants/plans";
import { useHydrated } from "@/hooks/useHydrated";

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
    const mounted = useHydrated();
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        const handleOpenCredits = () => setIsOpen(true);
        window.addEventListener("open-credits", handleOpenCredits);

        const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existingScript) {
            queueMicrotask(() => setScriptLoaded(true));
            return () => window.removeEventListener("open-credits", handleOpenCredits);
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

        return () => {
            window.removeEventListener("open-credits", handleOpenCredits);
        };
    }, []);

    React.useEffect(() => {
        if (!mounted) return;
        const showPricing = searchParams.get("showPricing") === "true";
        const planId = searchParams.get("plan");
        if (showPricing && planId && PLANS[planId as PlanId]) {
            queueMicrotask(() => {
                setIsOpen(true);
                if (scriptLoaded) {
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, "", newUrl);
                    void handlePurchase(planId);
                }
            });
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

    async function handlePurchase(planId: string) {
        if (loading) return;
        setLoading(true);

        try {
            if (typeof window.Razorpay === "undefined") {
                throw new Error("Razorpay SDK is not loaded. Please refresh the page and try again.");
            }

            const orderRes = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId }),
            });

            const orderData = await orderRes.json().catch(() => ({}));

            if (!orderRes.ok) {
                throw new Error(orderData.error || "Failed to create order");
            }

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
                        const verifyData = await verifyRes.json().catch(() => ({}));
                        alert(verifyData.error || "Payment verification failed. Please try again or contact support.");
                    }
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: { error: { description: string } }) {
                alert(`Payment failed: ${response.error?.description || "Transaction failed"}`);
            });
            rzp.open();

        } catch (err: unknown) {
            console.error("Payment initiation error:", err);
            const msg = err instanceof Error ? err.message : "Could not reach payment server. Please try again.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    }

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
                            <div className="px-6 py-5 border-b border-neutral-200/60 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-2xs shrink-0">
                                        <RiFlashlightLine size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight text-[#0A0A0A]">Get More Credits</h2>
                                        <p className="text-xs font-normal text-neutral-500">Choose a pack to tailor applications and prepare better profiles.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-[#0A0A0A] flex items-center justify-center transition-all"
                                >
                                    <RiCloseLine size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                                {success ? (
                                    <m.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-12 text-center space-y-3"
                                    >
                                        <div className="w-14 h-14 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center shadow-2xs">
                                            <RiCheckboxCircleLine size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-[#0A0A0A]">Credits Added Successfully!</h3>
                                            <p className="text-xs font-normal text-neutral-500 mt-0.5">Your account balance has been updated.</p>
                                        </div>
                                    </m.div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {plans.map((p) => (
                                            <m.div
                                                key={p.id}
                                                whileHover={{ y: -2 }}
                                                className={`relative p-6 rounded-3xl border transition-all flex flex-col items-center text-center justify-between ${
                                                    p.popular
                                                        ? 'border-2 border-[#0A0A0A] bg-white shadow-xl'
                                                        : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-100/60 hover:border-neutral-300/80'
                                                }`}
                                            >
                                                {p.popular && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-2xs z-10 whitespace-nowrap">
                                                        Most Popular
                                                    </div>
                                                )}
                                                <div className="w-full flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200/80 flex items-center justify-center text-[#0A0A0A] shadow-2xs mb-3">
                                                        {p.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-[#0A0A0A] text-xs">{p.name}</h4>
                                                        <div className="mt-1">
                                                            <span className="text-2xl font-extrabold text-[#0A0A0A] tracking-tight">{p.displayPrice}</span>
                                                        </div>
                                                        <div className="mt-2 inline-flex items-center px-3 py-1 bg-neutral-100 border border-neutral-200/60 rounded-full text-xs font-semibold text-neutral-600">
                                                            <span>{p.credits} Credits</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={loading}
                                                    onClick={() => handlePurchase(p.id)}
                                                    className={`w-full mt-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                                                        p.popular
                                                            ? 'bg-[#0A0A0A] text-white hover:bg-neutral-800'
                                                            : 'bg-white border border-neutral-200/80 text-[#0A0A0A] hover:bg-neutral-100'
                                                    } disabled:opacity-40 active:scale-95`}
                                                >
                                                    {loading ? "Processing..." : "Get Credits"}
                                                </button>
                                            </m.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-white border-t border-neutral-200/60 text-center shrink-0">
                                <p className="text-xs font-medium text-neutral-400">
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
