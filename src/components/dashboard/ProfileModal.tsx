"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { 
    RiCloseLine, 
    RiUser3Line, 
    RiLogoutCircleRLine,
    RiShieldLine,
    RiImageEditLine,
    RiIdCardLine,
    RiArrowRightSLine,
    RiGlobalLine,
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

type ViewState = "menu" | "edit" | "security" | "billing" | "localization";

export function ProfileModal({ isOpen, onCloseAction, userName, userImage }: ProfileModalProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const [view, setView] = useState<ViewState>("menu");
    const [newName, setNewName] = useState(userName);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
        if (!window.confirm("CRITICAL: This will permanently delete your Zebra AI account and all documents. This action cannot be undone. Proceed?")) return;
        
        setIsDeleting(true);
        try {
            const { error } = await authClient.deleteUser();
            if (error) throw new Error(error.message);
            
            showToast("Account deleted", "success");
            router.push("/");
        } catch (err) {
            showToast("Deletion failed", "error");
        } finally {
            setIsDeleting(false);
        }
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
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onCloseAction}
                    />
                    
                    <m.div 
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute top-0 right-0 h-full w-full max-w-[400px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.1)] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-black/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {view !== "menu" && (
                                    <button 
                                        onClick={handleBack}
                                        className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#737373] transition-all"
                                    >
                                        <RiArrowLeftLine size={20} />
                                    </button>
                                )}
                                <h3 className="text-lg font-black text-[#171717] tracking-tighter">
                                    {view === "menu" ? "Account Center" : 
                                     view === "edit" ? "Edit Profile" : 
                                     view === "security" ? "Security" : 
                                     view === "billing" ? "Billing" : "Language"}
                                </h3>
                            </div>
                            <button 
                                onClick={onCloseAction}
                                className="w-10 h-10 rounded-xl hover:bg-black/5 flex items-center justify-center text-[#737373] hover:text-[#171717] transition-all"
                            >
                                <RiCloseLine size={24} />
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
                                        <div className="p-8 flex flex-col items-center border-b border-black/5 bg-[#FAFAFA]">
                                            <div className="relative mb-5">
                                                <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#3B82F6] to-[#6366F1] p-0.5 shadow-xl">
                                                    <div className="w-full h-full rounded-[1.4rem] bg-white overflow-hidden flex items-center justify-center">
                                                        {userImage ? (
                                                            <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-2xl font-black text-[#3B82F6]">{userName.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-black text-[#171717] tracking-tight">{userName}</h4>
                                            <p className="text-xs font-bold text-[#A3A3A3] mt-1">{session?.user?.email}</p>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h5 className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-[0.2em] px-2 mb-2">Account Settings</h5>
                                                <div className="space-y-1">
                                                    <AccountAction icon={RiIdCardLine} title="Public Identity" subtitle="Update name and avatar" onClick={() => setView("edit")} />
                                                    <AccountAction icon={RiShieldLine} title="Security" subtitle="Password and account safety" onClick={() => setView("security")} />
                                                    <AccountAction icon={RiMoneyDollarCircleLine} title="Billing" subtitle="Manage your Pro subscription" onClick={() => setView("billing")} />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <h5 className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-[0.2em] px-2 mb-2">Preferences</h5>
                                                <div className="space-y-1">
                                                    <AccountAction icon={RiGlobalLine} title="Language" subtitle="Change interface language" onClick={() => setView("localization")} />
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
                                        className="p-8 space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-black text-[#A3A3A3] uppercase tracking-[0.2em] px-1">Full Name</label>
                                            <input 
                                                type="text" 
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full h-12 bg-[#FAFAFA] border border-black/5 rounded-xl px-4 font-bold text-[#171717] focus:border-[#3B82F6] outline-none transition-all"
                                                placeholder="Enter your name"
                                            />
                                        </div>

                                        <button 
                                            onClick={handleUpdateProfile}
                                            disabled={isSaving}
                                            className="w-full h-12 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isSaving ? <RiLoader4Line className="animate-spin" size={20} /> : <RiCheckLine size={20} />}
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
                                        className="p-8 space-y-6"
                                    >
                                        <div className="space-y-4">
                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                                <p className="text-[0.7rem] font-bold text-blue-700 leading-relaxed">
                                                    Your account is protected by industry-standard encryption and secure session management.
                                                </p>
                                            </div>

                                            <button 
                                                onClick={() => showToast("Password reset link sent to your email", "success")}
                                                className="w-full h-12 border border-black/10 hover:border-[#3B82F6] hover:text-[#3B82F6] rounded-xl flex items-center justify-between px-6 font-bold text-[#171717] transition-all"
                                            >
                                                <span>Reset Password</span>
                                                <RiMailLine size={18} />
                                            </button>

                                            <div className="pt-6 border-t border-black/5">
                                                <h5 className="text-[0.65rem] font-black text-red-500 uppercase tracking-[0.2em] px-1 mb-4">Danger Zone</h5>
                                                <button 
                                                    onClick={handleDeleteAccount}
                                                    disabled={isDeleting}
                                                    className="w-full h-12 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    {isDeleting ? <RiLoader4Line className="animate-spin" size={20} /> : <RiDeleteBinLine size={20} />}
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
                                        className="p-8 space-y-6"
                                    >
                                        <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-black/5 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-full flex items-center justify-center text-[#3B82F6] mb-4">
                                                <RiMoneyDollarCircleLine size={24} />
                                            </div>
                                            <h4 className="text-lg font-black text-[#171717]">Pro Membership</h4>
                                            <p className="text-xs text-[#737373] mt-2 mb-6">You are currently on the Free plan. Upgrade to unlock AI-powered content generation.</p>
                                            <button 
                                                onClick={() => showToast("Upgrade functionality coming soon", "success")}
                                                className="w-full h-12 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-[#2563EB] transition-all"
                                            >
                                                Upgrade to Pro
                                            </button>
                                        </div>
                                    </m.div>
                                )}

                                {view === "localization" && (
                                    <m.div 
                                        key="localization"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="p-8 space-y-2"
                                    >
                                        {["English (US)", "English (UK)", "Hindi", "Bengali"].map((lang) => (
                                            <button 
                                                key={lang}
                                                onClick={() => {
                                                    showToast(`Language set to ${lang}`, "success");
                                                    setView("menu");
                                                }}
                                                className="w-full h-12 border border-black/5 rounded-xl flex items-center justify-between px-6 font-bold text-[#171717] hover:bg-black/5 transition-all"
                                            >
                                                <span>{lang}</span>
                                                {lang === "English (US)" && <RiCheckLine size={18} className="text-[#3B82F6]" />}
                                            </button>
                                        ))}
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-black/5 bg-[#FAFAFA]">
                            <button 
                                onClick={handleLogout}
                                className="w-full h-12 bg-[#171717] hover:bg-[#0A0A0A] text-white rounded-xl flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98]"
                            >
                                <RiLogoutCircleRLine size={20} />
                                Sign Out
                            </button>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function AccountAction({ icon: Icon, title, subtitle, onClick }: { icon: any; title: string; subtitle: string; onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-all group text-left"
        >
            <div className="w-10 h-10 rounded-lg bg-white border border-black/5 flex items-center justify-center text-[#737373] group-hover:text-[#3B82F6] group-hover:border-[#3B82F6]/20 shadow-sm transition-all">
                <Icon size={18} />
            </div>
            <div className="flex-grow">
                <p className="text-sm font-black text-[#171717]">{title}</p>
                <p className="text-[0.65rem] text-[#A3A3A3] font-bold">{subtitle}</p>
            </div>
            <RiArrowRightSLine className="text-[#D4D4D4] group-hover:text-[#3B82F6] transition-colors" size={20} />
        </button>
    );
}
