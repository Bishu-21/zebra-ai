import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs as jobsTable } from "@/lib/schema";
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

    const userJobs = await db.query.jobs.findMany({
        where: eq(jobsTable.userId, session.user.id),
        orderBy: [desc(jobsTable.updatedAt)],
    });

    return NextResponse.json({ success: true, jobs: userJobs });

  } catch (error: any) {
    console.error("Jobs Fetch Error:", error);
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
  
      const { company, position, status, salary, url, resumeId } = await req.json();
  
      if (!company || !position) {
        return NextResponse.json({ error: "Company and Position are required" }, { status: 400 });
      }

      const id = crypto.randomUUID();
      await db.insert(jobsTable).values({
          id,
          userId: session.user.id,
          company,
          position,
          status: status || "Applied",
          salary,
          url,
          resumeId: resumeId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
      });
      
      return NextResponse.json({ success: true, id });
  
    } catch (error: any) {
      console.error("Job Save Error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    
        const { id, status, company, position, salary, url, resumeId } = await req.json();
    
        if (!id) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        await db.update(jobsTable)
            .set({ 
                status,
                company,
                position,
                salary,
                url,
                resumeId,
                updatedAt: new Date() 
            })
            .where(eq(jobsTable.id, id));
        
        return NextResponse.json({ success: true });
    
    } catch (error: any) {
        console.error("Job Update Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

        await db.delete(jobsTable)
            .where(eq(jobsTable.id, id));
        
        return NextResponse.json({ success: true });
    
    } catch (error: any) {
        console.error("Job Delete Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
