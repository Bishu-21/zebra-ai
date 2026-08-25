import { ZebraLoader } from "@/components/ui/ZebraLoader";

export default function AppLoading() {
    return (
        <main className="min-h-dvh bg-[#FAF9F6]">
            <ZebraLoader label="Preparing Zebra" detail="Your workspace is almost ready." />
        </main>
    );
}
