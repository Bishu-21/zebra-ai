import { notFound } from "next/navigation";
import { SettingsCheckClient } from "./client";

export const dynamic = "force-dynamic";

export default function SettingsCheckPage() {
    if (process.env.NODE_ENV === "production") notFound();
    return <SettingsCheckClient />;
}
