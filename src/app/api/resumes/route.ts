import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes as resumesTable, analysis as analysisTable } from "@/lib/schema";
import { eq, desc, and, inArray, lt, or, sql } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";
import { resumeSchema } from "@/lib/validation";
import { requireAuth, notFoundResponse } from "@/lib/auth-policy";
import { paginateRows, parsePagination } from "@/lib/pagination";
import { normalizeResumeContentForStorage } from "@/lib/resume-content";

export async function GET(req: NextRequest) {
  try {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { limit, cursor } = parsePagination(req);
    const cursorCondition = cursor
      ? or(
          lt(resumesTable.updatedAt, cursor.timestamp),
          and(eq(resumesTable.updatedAt, cursor.timestamp), lt(resumesTable.id, cursor.id)),
        )
      : undefined;

    const userResumes = await db.select({
        id: resumesTable.id,
        title: resumesTable.title,
        status: resumesTable.status,
        parentResumeId: resumesTable.parentResumeId,
        targetRole: resumesTable.targetRole,
        targetCompany: resumesTable.targetCompany,
        isPublic: resumesTable.isPublic,
        createdAt: resumesTable.createdAt,
        updatedAt: resumesTable.updatedAt,
      })
      .from(resumesTable)
      .where(and(eq(resumesTable.userId, authCtx.user.id), cursorCondition))
      .orderBy(desc(resumesTable.updatedAt), desc(resumesTable.id))
      .limit(limit + 1);

    const page = paginateRows(userResumes, limit, resume => ({ id: resume.id, timestamp: resume.updatedAt }));
    const resumeIds = page.items.map(resume => resume.id);
    const latestAnalyses = resumeIds.length ? await db.selectDistinctOn([analysisTable.resumeId], {
        id: analysisTable.id,
        resumeId: analysisTable.resumeId,
        score: analysisTable.score,
        createdAt: analysisTable.createdAt,
      })
      .from(analysisTable)
      .where(inArray(analysisTable.resumeId, resumeIds))
      .orderBy(analysisTable.resumeId, desc(analysisTable.createdAt)) : [];
    const analysisByResume = new Map(latestAnalyses.map(item => [item.resumeId, item]));
    const resumes = page.items.map(resume => ({
        ...resume,
        latestAnalysis: analysisByResume.get(resume.id) ?? null,
    }));

    return NextResponse.json({
        success: true,
        resumes,
        page: page.page,
    });

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

      const { id, title, content, expectedRevision } = validation.data;
      let normalizedContent = content;
      if (content !== undefined) {
          try {
              normalizedContent = normalizeResumeContentForStorage(content);
          } catch (error) {
              return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid resume content" }, { status: 400 });
          }
      }
  
      if (id) {
          if (expectedRevision === undefined) {
              return NextResponse.json({ error: "Expected revision is required" }, { status: 400 });
          }
          const [updated] = await db.update(resumesTable)
              .set({ 
                  title: title || "Untitled", 
                  content: normalizedContent,
                  revision: sql`${resumesTable.revision} + 1`,
                  updatedAt: new Date() 
              })
              .where(
                  and(
                      eq(resumesTable.id, id),
                      eq(resumesTable.userId, authCtx.user.id),
                      eq(resumesTable.revision, expectedRevision)
                  )
              )
              .returning({ id: resumesTable.id, revision: resumesTable.revision });
          
          if (!updated) {
              const owned = await db.query.resumes.findFirst({
                  columns: { id: true },
                  where: and(eq(resumesTable.id, id), eq(resumesTable.userId, authCtx.user.id)),
              });
              return owned
                  ? NextResponse.json({ error: "This resume was updated elsewhere. Refresh before saving again." }, { status: 409 })
                  : notFoundResponse("Resume");
          }

          return NextResponse.json({ success: true, ...updated });
      } else {
          const newId = crypto.randomUUID();
          await db.insert(resumesTable).values({
              id: newId,
              userId: authCtx.user.id,
              title: title || "Untitled Resume",
              content: normalizedContent || "",
              createdAt: new Date(),
              updatedAt: new Date(),
          });
          
          return NextResponse.json({ success: true, id: newId, revision: 0 });
      }
  
    } catch (error: unknown) {
      return handleApiError(error, "POST /api/resumes");
    }
}
