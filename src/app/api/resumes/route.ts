import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes as resumesTable, analysis as analysisTable } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";
import { resumeSchema } from "@/lib/validation";
import { requireAuth, notFoundResponse } from "@/lib/auth-policy";

export async function GET() {
  try {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    // Fetch resumes with their latest analysis
    const userResumes = await db.query.resumes.findMany({
        where: eq(resumesTable.userId, authCtx.user.id),
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

export async function POST(req: NextRequest) {
    try {
      const { auth: authCtx, errorResponse } = await requireAuth();
      if (errorResponse) return errorResponse;
  
      const body = await req.json();
      const validation = resumeSchema.safeParse(body);

      if (!validation.success) {
          return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
      }

      const { id, title, content } = validation.data;
  
      if (id) {
          const [updated] = await db.update(resumesTable)
              .set({ 
                  title: title || "Untitled", 
                  content, 
                  updatedAt: new Date() 
              })
              .where(
                  and(
                      eq(resumesTable.id, id),
                      eq(resumesTable.userId, authCtx.user.id)
                  )
              )
              .returning({ id: resumesTable.id });
          
          if (!updated) {
              return notFoundResponse("Resume");
          }

          return NextResponse.json({ success: true, id });
      } else {
          const newId = crypto.randomUUID();
          await db.insert(resumesTable).values({
              id: newId,
              userId: authCtx.user.id,
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
