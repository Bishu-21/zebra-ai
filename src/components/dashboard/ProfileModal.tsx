"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
    RiCloseLine, 
    RiLogoutCircleRLine,
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
        } catch {
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
                        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
                        onClick={onCloseAction}
                    />
                    
                    <m.div 
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute top-0 right-0 h-full w-full max-w-[400px] bg-[var(--background)] shadow-[var(--shadow-2xl)] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {view !== "menu" && (
                                    <button 
                                        onClick={handleBack}
                                        className="w-8 h-8 rounded-[var(--radius-sm)] hover:bg-muted flex items-center justify-center text-muted-foreground transition-all"
                                    >
                                        <RiArrowLeftLine size={20} />
                                    </button>
                                )}
                                <h3 className="text-lg font-black text-[var(--secondary)] tracking-tighter">
                                    {view === "menu" ? "Account Center" : 
                                     view === "edit" ? "Edit Profile" : 
                                     view === "security" ? "Security" : 
                                     view === "billing" ? "Billing" : "Security"}
                                </h3>
                            </div>
                            <button 
                                onClick={onCloseAction}
                                className="w-10 h-10 rounded-[var(--radius-md)] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-secondary transition-all"
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
                                        <div className="p-8 flex flex-col items-center border-b border-[var(--border-subtle)] bg-[var(--background)]">
                                            <div className="relative mb-5">
                                                <div className="w-20 h-20 rounded-[var(--radius-lg)] bg-gradient-to-br from-primary to-primary-dark p-0.5 shadow-xl">
                                                    <div className="w-full h-full rounded-[calc(var(--radius-lg)-2px)] bg-background overflow-hidden flex items-center justify-center">
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
                                                            <span className="text-2xl font-black text-primary">{userName.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-black text-[var(--secondary)] tracking-tight">{userName}</h4>
                                            <p className="text-xs font-bold text-[var(--muted-foreground)] mt-1">{session?.user?.email}</p>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h5 className="text-[0.6rem] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em] px-2 mb-2 opacity-60">Account Settings</h5>
                                                <div className="space-y-1">
                                                    <AccountAction icon={RiIdCardLine} title="Public Identity" subtitle="Update name and avatar" onClick={() => setView("edit")} />
                                                    <AccountAction icon={RiShieldLine} title="Security" subtitle="Password and account safety" onClick={() => setView("security")} />
                                                    <AccountAction icon={RiMoneyDollarCircleLine} title="Billing" subtitle="Manage your Pro subscription" onClick={() => setView("billing")} />
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
                                            <label className="text-[0.65rem] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em] px-1">Full Name</label>
                                            <input 
                                                type="text" 
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full h-12 bg-[var(--background)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-4 font-bold text-[var(--secondary)] focus:border-[var(--primary)] outline-none transition-all"
                                                placeholder="Enter your name"
                                            />
                                        </div>

                                        <button 
                                            onClick={handleUpdateProfile}
                                            disabled={isSaving}
                                            className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-primary-foreground rounded-[var(--radius-md)] flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] disabled:opacity-50"
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
                                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-[var(--radius-xl)]">
                                                <p className="text-[0.7rem] font-bold text-primary-dark leading-relaxed">
                                                    Your account is protected by industry-standard encryption and secure session management.
                                                </p>
                                            </div>

                                            <button 
                                                onClick={() => showToast("Password reset link sent to your email", "success")}
                                                className="w-full h-12 border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:text-[var(--primary)] rounded-[var(--radius-md)] flex items-center justify-between px-6 font-bold text-[var(--secondary)] transition-all"
                                            >
                                                <span>Reset Password</span>
                                                <RiMailLine size={18} />
                                            </button>

                                            <div className="pt-6 border-t border-border-subtle">
                                                <h5 className="text-[0.65rem] font-black text-destructive uppercase tracking-[0.2em] px-1 mb-4">Danger Zone</h5>
                                                <button 
                                                    onClick={handleDeleteAccount}
                                                    disabled={isDeleting}
                                                    className="w-full h-12 bg-destructive/5 hover:bg-destructive hover:text-destructive-foreground text-destructive rounded-[var(--radius-md)] flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] disabled:opacity-50"
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
                                        <div className="p-6 bg-[var(--background)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] mb-4">
                                                <RiMoneyDollarCircleLine size={24} />
                                            </div>
                                            <h4 className="text-lg font-black text-[var(--secondary)]">Pro Membership</h4>
                                            <p className="text-xs text-[var(--muted-foreground)] mt-2 mb-6">You are currently on the Free plan. Upgrade to unlock AI-powered content generation.</p>
                                            <button 
                                                onClick={() => showToast("Upgrade functionality coming soon", "success")}
                                                className="w-full h-12 bg-[var(--primary)] text-primary-foreground rounded-[var(--radius-md)] font-bold hover:bg-[var(--primary-dark)] transition-all"
                                            >
                                                Upgrade to Pro
                                            </button>
                                        </div>
                                    </m.div>
                                )}


                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border-subtle bg-background">
                            <button 
                                onClick={handleLogout}
                                className="w-full h-12 bg-foreground hover:opacity-90 text-background rounded-[var(--radius-md)] flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98]"
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

function AccountAction({ icon: Icon, title, subtitle, onClick }: { icon: React.ComponentType<{ size?: number }>; title: string; subtitle: string; onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center gap-4 p-3 rounded-[var(--radius-md)] hover:bg-muted transition-all group text-left"
        >
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-background border border-border-subtle flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/20 shadow-sm transition-all">
                <Icon size={18} />
            </div>
            <div className="flex-grow">
                <p className="text-sm font-black text-[var(--secondary)]">{title}</p>
                <p className="text-[0.65rem] text-[var(--muted-foreground)] font-bold">{subtitle}</p>
            </div>
            <RiArrowRightSLine className="text-muted-foreground/30 group-hover:text-primary transition-colors" size={20} />
        </button>
    );
}
