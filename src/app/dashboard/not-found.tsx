import Link from "next/link";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { featureChrome } from "@/components/dashboard/feature-chrome";

export default function DashboardNotFound() {
    return (
        <DashboardPage>
            <div className={`${featureChrome.emptyState} mx-auto max-w-lg`}>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">This workspace page was not found</h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    The dashboard link may be outdated. Your saved resumes and applications are still available from Home.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link href="/dashboard" className={featureChrome.primaryButton}>
                        Back to dashboard
                    </Link>
                    <Link href="/dashboard/job-tracker" className={featureChrome.secondaryButton}>
                        Open applications
                    </Link>
                </div>
            </div>
        </DashboardPage>
    );
}
