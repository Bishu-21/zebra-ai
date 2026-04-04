import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumes as resumesTable, analysis as analysisTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch resumes with their latest analysis
    const userResumes = await db.query.resumes.findMany({
        where: eq(resumesTable.userId, session.user.id),
        orderBy: [desc(resumesTable.updatedAt)],
    });

    const resumesWithScores = await Promise.all(userResumes.map(async (resume) => {
        const latestAnalysis = await db.query.analysis.findFirst({
            where: eq(analysisTable.resumeId, resume.id),
            orderBy: [desc(analysisTable.createdAt)],
        });
        return {
            ...resume,
            latestAnalysis: latestAnalysis || null
        };
    }));

    return NextResponse.json({ success: true, resumes: resumesWithScores });

  } catch (error: any) {
    console.error("Resumes Fetch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
      const session = await auth.api.getSession({
          headers: await headers(),
      });
  
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { id, title, content } = await req.json();
  
      if (id) {
          // Update existing
          await db.update(resumesTable)
              .set({ 
                  title: title || "Untitled", 
                  content, 
                  updatedAt: new Date() 
              })
              .where(eq(resumesTable.id, id));
          
          return NextResponse.json({ success: true, id });
      } else {
          // Create new
          const newId = crypto.randomUUID();
          await db.insert(resumesTable).values({
              id: newId,
              userId: session.user.id,
              title: title || "Untitled Resume",
              content: content || "",
              createdAt: new Date(),
              updatedAt: new Date(),
          });
          
          return NextResponse.json({ success: true, id: newId });
      }
  
    } catch (error: any) {
      console.error("Resume Save Error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
