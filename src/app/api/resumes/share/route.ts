import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

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

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
