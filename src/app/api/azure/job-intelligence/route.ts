import { NextRequest, NextResponse } from "next/server";
import { extractJobIntelligence, isAzureConfigured } from "@/lib/azure/language";

export async function POST(req: NextRequest) {
    try {
        const { jobDescription } = await req.json();

        if (!jobDescription) {
            return NextResponse.json({ error: "Job description is required" }, { status: 400 });
        }

        if (!isAzureConfigured) {
            // Fallback: return empty but successful if not configured, as requested
            return NextResponse.json({ 
                success: false, 
                error: "Azure AI Language is not configured",
                fallback: true 
            });
        }

        const intelligence = await extractJobIntelligence(jobDescription);

        if (!intelligence) {
            return NextResponse.json({ error: "Failed to extract job intelligence" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: intelligence
        });

    } catch (error) {
        console.error("API error in job-intelligence:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
