"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RiAlertLine, RiRestartLine } from "react-icons/ri";
import { isTransientNavigationError } from "@/lib/error-classification";
import { featureChrome } from "@/components/dashboard/feature-chrome";

export default function DashboardError(props: { error: Error & { digest?: string }; retry: () => void }) {
    const { error, retry } = props;
    const isTransient = isTransientNavigationError(error);

    useEffect(() => {
        if (!isTransient) console.error("Dashboard Runtime Exception:", error);
    }, [error, isTransient]);

    return (
        <div className="flex flex-grow items-center justify-center bg-[#FBFBFB] p-6">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-neutral-200/70 bg-white p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                    <RiAlertLine size={24} />
                </div>

                <div className="space-y-2">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {isTransient ? "This page was interrupted" : "This page could not be loaded"}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {isTransient
                            ? "A brief navigation interruption occurred. Your saved work is still in your account. Try this page again."
                            : "Something went wrong while opening this dashboard view. Your saved resumes, applications, and credits are unchanged. You can try again or return to Home."}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => retry()}
                        className={featureChrome.primaryButton}
                    >
                        <RiRestartLine size={16} />
                        Try again
                    </button>
                    <Link href="/dashboard" className={featureChrome.secondaryButton}>
                        Back to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
