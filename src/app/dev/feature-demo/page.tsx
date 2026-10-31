import { notFound } from "next/navigation";
import { DemoCapturePlayer } from "@/components/demo/DemoCapturePlayer";
import { isDemoId } from "@/lib/demo-catalog";

export const dynamic = "force-dynamic";

export default async function FeatureDemoCapturePage({ searchParams }: { searchParams: Promise<{ feature?: string }> }) {
    if (process.env.NODE_ENV === "production") notFound();
    const { feature = "overview" } = await searchParams;
    if (!isDemoId(feature)) notFound();
    return <main aria-label="Synthetic product showcase recording"><DemoCapturePlayer id={feature} /></main>;
}
