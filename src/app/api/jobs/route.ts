import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs as jobsTable } from "@/lib/schema";
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

    const userJobs = await db.query.jobs.findMany({
        where: eq(jobsTable.userId, session.user.id),
        orderBy: [desc(jobsTable.updatedAt)],
    });

    return NextResponse.json({ success: true, jobs: userJobs });

  } catch (error: unknown) {
    return handleApiError(error, "GET /api/jobs");
  }
}

import { jobSchema } from "@/lib/validation";

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

      const { company, position, status, salary, url, location, jobType, description } = validation.data;
      const resumeId = body.resumeId; // resumeId is handled separately if needed

      const id = crypto.randomUUID();
      await db.insert(jobsTable).values({
          id,
          userId: session.user.id,
          company,
          position,
          status: status || "Applied",
          salary,
          url,
          location,
          jobType,
          description,
          resumeId: resumeId || null,
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
        const validation = jobSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { id, status, company, position, salary, url, location, jobType, description } = validation.data;
        const resumeId = body.resumeId;

        if (!id) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        // Ownership check: only update if job belongs to this user
        const result = await db.update(jobsTable)
            .set({ 
                status,
                company,
                position,
                salary,
                url,
                location,
                jobType,
                description,
                resumeId,
                updatedAt: new Date() 
            })
            .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, session.user.id)));
        
        if (result.rowCount === 0) {
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
    
        const { id } = await req.json();
    
        if (!id) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        // Ownership check: only delete if job belongs to this user
        const result = await db.delete(jobsTable)
            .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, session.user.id)));
        
        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    
    } catch (error: unknown) {
        return handleApiError(error, "DELETE /api/jobs");
    }
}
