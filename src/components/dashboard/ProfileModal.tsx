"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    RiCloseLine,
    RiLogoutBoxRLine,
    RiShieldLine,
    RiIdCardLine,
    RiArrowRightSLine,
    RiArrowLeftLine,
    RiCheckLine,
    RiLoader4Line,
    RiDeleteBinLine,
    RiMoneyDollarCircleLine,
    RiMailLine
} from "react-icons/ri";
import { signOut, authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface ProfileModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    userName: string;
    userImage?: string | null;
}

type ViewState = "menu" | "edit" | "security" | "billing";

export function ProfileModal({ isOpen, onCloseAction, userName, userImage }: ProfileModalProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const user = session?.user as { plan?: string | null } | undefined;
    const [view, setView] = useState<ViewState>("menu");
    const [newName, setNewName] = useState(userName);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCloseAction();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onCloseAction]);

    const handleLogout = async () => {
        try {
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/");
                    },
                },
            });
        } catch (error) {
            console.error("Logout failed:", error);
            showToast("Sign out failed. Please try again.", "error");
        }
    };

    const handleUpdateProfile = async () => {
        if (newName === userName) {
            setView("menu");
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await authClient.updateUser({
                name: newName,
            });

            if (error) throw new Error(error.message || "Failed to update profile");

            showToast("Profile updated successfully", "success");
            router.refresh();
            setView("menu");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Update failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("This will permanently delete your account. This action cannot be undone. Proceed?")) return;

        setIsDeleting(true);
        try {
            const { error } = await authClient.deleteUser();
            if (error) throw new Error(error.message);

            showToast("Account deleted", "success");
            router.push("/");
        } catch {
            showToast("Deletion failed", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!session?.user?.email) {
            showToast("No email associated with account", "error");
            return;
        }
        try {
            const { error } = await authClient.requestPasswordReset({
                email: session.user.email,
                redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/signin`,
            });
            if (error) throw new Error(error.message);
            showToast("Password reset link sent to your email", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to send reset link", "error");
        }
    };

    const handleUpgrade = () => {
        onCloseAction();
        window.dispatchEvent(new CustomEvent("open-credits"));
    };

    const handleBack = () => setView("menu");

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] overflow-hidden">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md"
                        onClick={onCloseAction}
                    />

                    <m.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="absolute top-0 right-0 h-full w-full max-w-[380px] bg-white shadow-2xl border-l border-neutral-200/80 flex flex-col z-10"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-neutral-200/60 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                {view !== "menu" && (
                                    <button
                                        onClick={handleBack}
                                        className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-[#0A0A0A] flex items-center justify-center transition-all"
                                    >
                                        <RiArrowLeftLine size={18} />
                                    </button>
                                )}
                                <h3 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                                    {view === "menu" ? "Account Center" :
                                     view === "edit" ? "Edit Profile" :
                                     view === "security" ? "Security" :
                                     view === "billing" ? "Billing" : "Account Center"}
                                </h3>
                            </div>
                            <button
                                onClick={onCloseAction}
                                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-[#0A0A0A] flex items-center justify-center transition-all"
                            >
                                <RiCloseLine size={18} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {view === "menu" && (
                                    <m.div
                                        key="menu"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex flex-col"
                                    >
                                        {/* Profile Card */}
                                        <div className="p-6 flex flex-col items-center border-b border-neutral-200/60 bg-[#FAF9F6]">
                                            <div className="w-20 h-20 rounded-2xl bg-[#0A0A0A] text-white flex items-center justify-center overflow-hidden shadow-2xs border border-neutral-200/80 mb-3">
                                                {userImage ? (
                                                    <Image
                                                        src={userImage}
                                                        alt={userName}
                                                        width={80}
                                                        height={80}
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-bold">{userName.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <h4 className="text-base font-bold text-[#0A0A0A] tracking-tight">{userName}</h4>
                                            <p className="text-xs font-normal text-neutral-500 mt-0.5">{session?.user?.email}</p>
                                        </div>

                                        <div className="p-6 space-y-4">
                                            <div>
                                                <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-3">Account Settings</h5>
                                                <div className="space-y-2">
                                                    <AccountAction icon={RiIdCardLine} title="Public Identity" subtitle="Update name and avatar" onClick={() => setView("edit")} />
                                                    <AccountAction icon={RiShieldLine} title="Security" subtitle="Password and account safety" onClick={() => setView("security")} />
                                                    <AccountAction icon={RiMoneyDollarCircleLine} title="Billing" subtitle={user?.plan ? `Plan: ${user.plan}` : "Plan: Starter"} onClick={() => setView("billing")} />
                                                </div>
                                            </div>
                                        </div>
                                    </m.div>
                                )}

                                {view === "edit" && (
                                    <m.div
                                        key="edit"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="p-6 space-y-5"
                                    >
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Full Name</label>
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] rounded-full px-4 py-2.5 text-xs font-semibold text-[#0A0A0A] outline-none transition-all"
                                                placeholder="Enter your name"
                                            />
                                        </div>

                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isSaving}
                                            className="w-full py-3 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            {isSaving ? <RiLoader4Line className="animate-spin" size={16} /> : <RiCheckLine size={16} />}
                                            Update Profile
                                        </button>
                                    </m.div>
                                )}

                                {view === "security" && (
                                    <m.div
                                        key="security"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="p-6 space-y-5"
                                    >
                                        <div className="space-y-4">
                                            <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl">
                                                <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                                                    Your account is protected by encrypted session management and secure authentication.
                                                </p>
                                            </div>

                                            <button
                                                onClick={handleResetPassword}
                                                className="w-full py-3 bg-neutral-50 border border-neutral-200/80 hover:bg-neutral-100 rounded-full text-xs font-bold text-[#0A0A0A] transition-all flex items-center justify-between px-5"
                                            >
                                                <span>Reset Password</span>
                                                <RiMailLine size={16} />
                                            </button>

                                            <div className="pt-4 border-t border-neutral-200/60">
                                                <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Danger Zone</h5>
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={isDeleting}
                                                    className="w-full py-3 bg-red-50 text-red-700 border border-red-200/80 hover:bg-red-100 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                                >
                                                    {isDeleting ? <RiLoader4Line className="animate-spin" size={16} /> : <RiDeleteBinLine size={16} />}
                                                    Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    </m.div>
                                )}

                                {view === "billing" && (
                                    <m.div
                                        key="billing"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="p-6 space-y-5"
                                    >
                                        <div className="p-6 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex flex-col items-center text-center">
                                            <div className="w-10 h-10 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center mb-3">
                                                <RiMoneyDollarCircleLine size={20} />
                                            </div>
                                            <h4 className="text-base font-bold text-[#0A0A0A]">
                                                 {user?.plan ? `${user.plan} Plan` : "Starter Plan"}
                                            </h4>
                                            <p className="text-xs font-normal text-neutral-500 mt-1 mb-5 leading-relaxed">
                                                 {user?.plan && user.plan !== "Free" && user.plan !== "Starter"
                                                     ? `You are currently on the ${user.plan} plan.`
                                                     : "Upgrade your tier to unlock advanced resume tailoring and extra credits."}
                                            </p>
                                            {(!user?.plan || user.plan === "Free" || user.plan === "Starter") && (
                                                <button
                                                    onClick={handleUpgrade}
                                                    className="w-full py-2.5 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all"
                                                >
                                                    Upgrade Plan
                                                </button>
                                            )}
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-neutral-200/60 bg-white sticky bottom-0 shrink-0">
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RiLogoutBoxRLine size={16} />
                                Sign Out
                            </button>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function AccountAction({ icon: Icon, title, subtitle, onClick }: { icon: React.ComponentType<{ size?: number }>; title: string; subtitle: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-neutral-50/50 border border-neutral-200/60 hover:bg-neutral-100/80 hover:border-neutral-300/80 transition-all group text-left"
        >
            <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-[#0A0A0A] shadow-2xs group-hover:scale-105 transition-all shrink-0">
                <Icon size={18} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-xs font-bold text-[#0A0A0A]">{title}</p>
                <p className="text-[11px] font-normal text-neutral-500 truncate">{subtitle}</p>
            </div>
            <RiArrowRightSLine className="text-neutral-400 group-hover:text-[#0A0A0A] transition-colors shrink-0" size={18} />
        </button>
    );
}
