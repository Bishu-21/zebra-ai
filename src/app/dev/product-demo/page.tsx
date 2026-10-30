import { notFound } from "next/navigation";
import { ProductDemoCapture } from "./capture";

export const dynamic = "force-dynamic";

export default async function ProductDemoCapturePage({
    searchParams,
}: {
    searchParams: Promise<{ scene?: string }>;
}) {
    if (process.env.NODE_ENV === "production") notFound();

    const { scene } = await searchParams;
    const allowed = new Set(["import", "review", "edit", "preview", "export"]);
    const resolved = scene && allowed.has(scene) ? scene : "preview";

    return <ProductDemoCapture scene={resolved} />;
}
