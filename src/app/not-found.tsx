import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-6 font-sans">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">404</p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">This page is not available</h1>
                <p className="text-sm leading-6 text-muted-foreground">
                    The address may be mistyped, or the page may have moved. Public product pages and your signed-in workspace are still available from Home.
                </p>
                <div className="flex flex-col gap-3">
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0A0A0A] px-4 text-sm font-semibold text-white hover:bg-neutral-800"
                    >
                        Go to home
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-foreground hover:bg-muted"
                    >
                        Open dashboard
                    </Link>
                    <Link
                        href="/sitemap"
                        className="text-sm font-medium text-muted-foreground underline"
                    >
                        View sitemap
                    </Link>
                </div>
            </div>
        </main>
    );
}
