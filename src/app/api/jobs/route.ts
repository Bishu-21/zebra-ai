import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs as jobsTable, resumes as resumesTable, resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import { idSchema, jobSchema } from "@/lib/validation";
import crypto from "crypto";

const jobPatchSchema = jobSchema.partial().extend({ id: idSchema });

function optionalText(value: string | undefined) {
    return value?.trim() ? value.trim() : null;
}

async function validateLinkedAsset({
    resumeId,
    resumeVersionId,
    userId,
}: {
    resumeId?: string;
    resumeVersionId?: string;
    userId: string;
}) {
    if (resumeId && resumeVersionId) {
        return "Cannot link both a resume and a resume version";
    }

    if (resumeId) {
        const resume = await db.query.resumes.findFirst({
            where: and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, userId)),
            columns: { id: true },
        });
        if (!resume) return "Resume not found or unauthorized";
    }

    if (resumeVersionId) {
        const version = await db.query.resumeVersions.findFirst({
            where: and(eq(resumeVersionsTable.id, resumeVersionId), eq(resumeVersionsTable.userId, userId)),
            columns: { id: true },
        });
        if (!version) return "Resume version not found or unauthorized";
    }

    return null;
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userJobs = await db.query.jobs.findMany({
        where: eq(jobsTable.userId, session.user.id),
        orderBy: [desc(jobsTable.updatedAt)],
    });

    return NextResponse.json({ success: true, jobs: userJobs });

  } catch (error: unknown) {
    return handleApiError(error, "GET /api/jobs");
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
  
      const body = await req.json();
      const validation = jobSchema.safeParse(body);
  
      if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
      }

      const { company, position, status, salary, url, location, jobType, description, resumeId, resumeVersionId } = validation.data;

      const linkError = await validateLinkedAsset({ resumeId, resumeVersionId, userId: session.user.id });
      if (linkError) return NextResponse.json({ error: linkError }, { status: 400 });

      const id = crypto.randomUUID();
      await db.insert(jobsTable).values({
          id,
          userId: session.user.id,
          company,
          position,
          status: status || "Applied",
          salary: optionalText(salary),
          url: optionalText(url),
          location: optionalText(location),
          jobType: optionalText(jobType),
          description: optionalText(description),
          resumeId: optionalText(resumeId),
          resumeVersionId: optionalText(resumeVersionId),
          createdAt: new Date(),
          updatedAt: new Date(),
      });
      
      return NextResponse.json({ success: true, id });
  
    } catch (error: unknown) {
      return handleApiError(error, "POST /api/jobs");
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
    
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        const body = await req.json();
        const validation = jobPatchSchema.safeParse(body);
    
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { id, status, company, position, salary, url, location, jobType, description, resumeId, resumeVersionId } = validation.data;

        const linkError = await validateLinkedAsset({ resumeId, resumeVersionId, userId: session.user.id });
        if (linkError) return NextResponse.json({ error: linkError }, { status: 400 });

        const updateValues = {
            ...(status !== undefined ? { status } : {}),
            ...(company !== undefined ? { company } : {}),
            ...(position !== undefined ? { position } : {}),
            ...(salary !== undefined ? { salary: optionalText(salary) } : {}),
            ...(url !== undefined ? { url: optionalText(url) } : {}),
            ...(location !== undefined ? { location: optionalText(location) } : {}),
            ...(jobType !== undefined ? { jobType: optionalText(jobType) } : {}),
            ...(description !== undefined ? { description: optionalText(description) } : {}),
            ...(resumeId !== undefined ? { resumeId: optionalText(resumeId) } : {}),
            ...(resumeVersionId !== undefined ? { resumeVersionId: optionalText(resumeVersionId) } : {}),
            updatedAt: new Date(),
        };

        const updated = await db.update(jobsTable)
            .set(updateValues)
            .where(
                and(
                    eq(jobsTable.id, id),
                    eq(jobsTable.userId, session.user.id)
                )
            )
            .returning({ id: jobsTable.id });
        
        if (updated.length === 0) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    
    } catch (error: unknown) {
        return handleApiError(error, "PATCH /api/jobs");
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
    
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        const body = await req.json();
        const validation = idSchema.safeParse(body.id);
    
        if (!validation.success) {
            return NextResponse.json({ error: "Valid job ID is required" }, { status: 400 });
        }

        const id = validation.data;

        const deleted = await db.delete(jobsTable)
            .where(
                and(
                    eq(jobsTable.id, id),
                    eq(jobsTable.userId, session.user.id)
                )
            )
            .returning({ id: jobsTable.id });
        
        if (deleted.length === 0) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    
    } catch (error: unknown) {
        return handleApiError(error, "DELETE /api/jobs");
    }
}
