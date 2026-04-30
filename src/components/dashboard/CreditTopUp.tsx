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
import { useRouter } from "next/navigation";

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
    const router = useRouter();

    React.useEffect(() => {
        setMounted(true);
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const plans = [
        { ...PLANS.starter, icon: <RiFlashlightLine size={20} className="text-[var(--muted-foreground)]/60" /> },
        { ...PLANS.pro, icon: <RiStarLine size={20} className="text-[var(--muted-foreground)]/80" />, popular: true },
        { ...PLANS.enterprise, icon: <RiShieldCheckLine size={24} className="text-[var(--foreground)]" /> },
    ];

    const handlePurchase = async (planId: string) => {
        if (loading) return;
        setLoading(true);

        try {
            // 1. Create Order on Server
            const orderRes = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId }),
            });

            if (!orderRes.ok) throw new Error("Failed to create order");
            const orderData = await orderRes.json();

            // 2. Open Razorpay Checkout Modal
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
                    color: "#2563EB", // Primary blue token
                },
                handler: async function (response: RazorpayResponse) {
                    // 3. Verify Payment on Server
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
                        alert("Payment verification failed. Please contact support.");
                    }
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: { error: { description: string } }) {
                alert(`Provisioning failed: ${response.error.description}`);
            });
            rzp.open();

        } catch (err) {
            console.error(err);
            alert("Could not reach provisioning server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full bg-[var(--secondary)] hover:bg-[var(--secondary)]/90 text-white px-4 py-3 rounded-[var(--radius-md)] text-[0.7rem] font-bold uppercase tracking-widest transition-all shadow-lg shadow-black/5 active:scale-95 flex items-center justify-center gap-2"
            >
                <RiAddLine size={14} />
                Provision
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" 
                        onClick={() => !loading && setIsOpen(false)}
                    />
                    <div className="relative bg-[var(--background)] w-full max-w-3xl rounded-[var(--radius-xl)] shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="p-10 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--background)]/40 backdrop-blur-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-[var(--secondary)] rounded-[var(--radius-md)] flex items-center justify-center text-white shadow-lg shadow-black/10">
                                    <RiFlashlightLine size={28} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Intelligence Allocation</h2>
                                    <p className="text-[0.75rem] font-medium text-[var(--muted-foreground)] tracking-tight">Provision additional units to scale your professional narrative.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--secondary)] hover:bg-[var(--foreground)] group transition-all">
                                <RiCloseCircleLine size={24} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <div className="p-8 md:p-10 overflow-y-auto no-scrollbar">
                            {success ? (
                                <div className="flex flex-col items-center justify-center py-16 animate-in fade-in slide-in-from-bottom-8 text-center">
                                    <div className="w-20 h-20 bg-[var(--foreground)] text-[var(--background)] rounded-[var(--radius-lg)] flex items-center justify-center mb-6 shadow-xl">
                                        <RiCheckboxCircleLine size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 tracking-tight">Credits Provisioned</h3>
                                    <p className="text-[var(--muted-foreground)] font-medium">Your account state is being updated.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {plans.map((p: { id: string; name: string; credits: number; displayPrice: string; icon: React.ReactNode; popular?: boolean }) => (
                                        <div 
                                            key={p.id}
                                            className={`relative p-8 rounded-[var(--radius-lg)] border transition-all group flex flex-col items-center text-center ${p.popular ? 'border-[var(--primary)]/20 bg-[var(--primary)]/[0.03] shadow-md' : 'border-[var(--border-subtle)] bg-[var(--background)]/40 hover:bg-[var(--background)]/60 hover:shadow-sm'}`}
                                        >
                                            {p.popular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-white text-[0.5rem] font-bold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full shadow-lg z-10 whitespace-nowrap">
                                                    Optimal Capacity
                                                </div>
                                            )}
                                            <div className="mb-6 bg-[var(--background)] rounded-[var(--radius-md)] w-14 h-14 flex items-center justify-center shadow-sm border border-[var(--border-subtle)] group-hover:scale-110 transition-transform">
                                                {p.icon}
                                            </div>
                                            <h4 className="font-bold text-[var(--secondary)] mb-2 tracking-tight text-[0.65rem] uppercase tracking-[0.2em]">{p.name}</h4>
                                            <div className="mb-8">
                                                 <div className="flex flex-col items-center">
                                                     <span className="text-4xl font-black text-[var(--foreground)] tracking-tighter">{p.displayPrice}</span>
                                                     <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-[var(--muted)] rounded-full">
                                                        <div className="w-1.5 h-1.5 bg-[var(--primary)]/40 rounded-full animate-pulse" />
                                                        <p className="text-[0.6rem] text-[var(--muted-foreground)] font-bold uppercase tracking-widest">{p.credits} Intelligence Units</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handlePurchase(p.id)}
                                                className={`w-full py-4 rounded-[var(--radius-md)] text-[0.65rem] font-bold uppercase tracking-widest transition-all ${p.popular ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-lg shadow-[var(--primary)]/10' : 'bg-[var(--muted)] text-[var(--secondary)] hover:bg-[var(--muted)]/80'} disabled:opacity-50 active:scale-95`}
                                            >
                                                {loading ? "Allocating..." : "Provision"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-[var(--muted)]/30 border-t border-[var(--border-subtle)] flex items-center justify-center gap-2">
                             <div className="w-1.5 h-1.5 bg-[var(--muted-foreground)]/20 rounded-full" />
                             <p className="text-[0.6rem] text-[var(--muted-foreground)]/60 font-bold uppercase tracking-[0.4em]">Terminal: Secure Provisioning Layer</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
