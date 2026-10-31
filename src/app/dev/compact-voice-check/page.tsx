import { notFound } from "next/navigation";
import { ZebuProvider } from "@/context/ZebuContext";
import { ZebuAssistant } from "@/components/dashboard/ZebuAssistant";

export default function CompactVoiceCheck() {
    if (process.env.NODE_ENV === "production") notFound();
    return <ZebuProvider><main className="p-8"><h1>Voice navigation check</h1><p>Synthetic browser verification.</p><ZebuAssistant /></main></ZebuProvider>;
}
