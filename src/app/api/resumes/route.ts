import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumes as resumesTable, analysis as analysisTable } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";

export async function GET() {
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

  } catch (error: unknown) {
    return handleApiError(error, "GET /api/resumes");
  }
}

import { resumeSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
    try {
      const session = await auth.api.getSession({
          headers: await headers(),
      });
  
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const body = await req.json();
      const validation = resumeSchema.safeParse(body);

      if (!validation.success) {
          return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
      }

      const { id, title, content } = validation.data;
  
      if (id) {
          // Update existing — ownership check: only update if resume belongs to this user
          const result = await db.update(resumesTable)
              .set({ 
                  title: title || "Untitled", 
                  content, 
                  updatedAt: new Date() 
              })
              .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, session.user.id)));
          
          if (result.rowCount === 0) {
              return NextResponse.json({ error: "Resume not found" }, { status: 404 });
          }

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
  
    } catch (error: unknown) {
      return handleApiError(error, "POST /api/resumes");
    }
}
