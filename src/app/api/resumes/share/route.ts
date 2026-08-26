import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { toPublicResumeContent } from "@/lib/resume-content";

/**
 * PUBLIC SHARE DATA API
 * 
 * Fetches resume content by share token for public viewing/importing.
 * Strictly checks isPublic = true.
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        const data = await db.query.resumes.findFirst({
            where: and(
                eq(resumes.shareToken, token),
                eq(resumes.isPublic, true)
            ),
            columns: {
                title: true,
                content: true,
            }
        });

        if (!data) {
            return NextResponse.json({ error: "Resume not found or private" }, { status: 404 });
        }

        let storedContent: unknown = {};
        try { storedContent = JSON.parse(data.content || "{}"); } catch { storedContent = {}; }
        return NextResponse.json({
            title: data.title,
            content: JSON.stringify(toPublicResumeContent(storedContent)),
        });

    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
    }
}
