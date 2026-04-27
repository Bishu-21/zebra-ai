"use client";

import { useEffect } from "react";
import { RiAlertLine, RiRestartLine } from "react-icons/ri";

export default function DashboardError(props: any) {
    const { error, unstable_retry: unstable_retryAction } = props;
    useEffect(() => {
        console.error("Dashboard Runtime Exception:", error);
    }, [error]);

    return (
        <div className="flex-grow flex items-center justify-center bg-[#FBFBFB] p-6">
            <div className="max-w-md w-full bg-white border border-black/8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 text-center space-y-6">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto text-red-500">
                    <RiAlertLine size={24} />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-lg font-black text-[#171717] tracking-tight">Segment Isolation</h2>
                    <p className="text-sm text-[#737373] leading-relaxed">
                        The dashboard encountered a localized exception. Your session remains secure, and you can attempt to hot-reload this segment.
                    </p>
                </div>

                <button
                    onClick={() => unstable_retryAction()}
                    className="w-full h-11 bg-[#171717] hover:bg-[#0A0A0A] text-white rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <RiRestartLine size={16} />
                    Re-initialize Workspace
                </button>

                <div className="pt-2">
                    <p className="text-[10px] font-mono text-black/20 uppercase tracking-[0.2em]">Error Code: {error?.digest || "LOCAL_REJECTION"}</p>
                </div>
            </div>
        </div>
    );
}
