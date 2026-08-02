import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { user as userTable, atsOptimisations as atsTable, resumeVersions as resumeVersionsTable, applications as applicationsTable, applicationChanges as applicationChangesTable, workItems as workItemsTable } from "@/lib/schema";
import { eq, sql, and } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";
import { tailorSchema } from "@/lib/validation";
import crypto from "crypto";
import { requireAuth, getUserOwnedResume, getUserOwnedApplication, notFoundResponse } from "@/lib/auth-policy";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemma-4-31b-it" 
});

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const validation = tailorSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { resumeId, jobDescription } = validation.data;
        const { saveAsVersion, company, targetRole, applicationId } = body as {
            saveAsVersion?: boolean;
            company?: string;
            targetRole?: string;
            applicationId?: string;
        };

        // 1. Check credits
        const userData = await db.query.user.findFirst({
            where: eq(userTable.id, authCtx.user.id)
        });

        if (!userData || userData.credits <= 0) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
        }

        // 2. Fetch Resume & User's saved Work Items
        const resume = await getUserOwnedResume(authCtx.user.id, resumeId);
        if (!resume) {
            return notFoundResponse("Resume");
        }

        if (applicationId) {
            const app = await getUserOwnedApplication(authCtx.user.id, applicationId);
            if (!app) {
                return notFoundResponse("Application");
            }
        }

        const userWork = await db.query.workItems.findMany({
            where: eq(workItemsTable.userId, authCtx.user.id),
        });

        const workSummary = userWork.map(w => `- [${w.category}] ${w.title}: ${w.description || ''} (Tools: ${JSON.stringify(w.tools || [])}, Result: ${w.result || 'N/A'})`).join("\n");

        // 3. AI Prompt: Elite ATS & Work Alignment Comparison
        const prompt = `
          SYSTEM: You are an Elite Career & ATS Helper for Zebra. 
          Perform a deep-dive comparison between the student's Resume, Saved Work Library, and Job Description.

          RESUME CONTENT:
          """
          ${resume.content}
          """

          SAVED WORK LIBRARY:
          """
          ${workSummary || "No explicit work items saved yet."}
          """

          JOB DESCRIPTION:
          """
          ${jobDescription}
          """

          TASK:
          1. Calculate an accurate ATS Match Score (0-100).
          2. Identify keywords found and missing.
          3. Analyze "Role Fit" based on experience and hard skills.
          4. Provide high-impact "Tailoring Suggestions".
          5. Provide 2-5 explicit, granular section-by-section changes (Summary, Experience, Skills, Projects) comparing original vs suggested text for student review.

          OUTPUT CONSTRAINT:
          - Return ONLY a valid JSON object.
          - NO markdown code block wrappers.


          REQUIRED JSON SCHEMA:
          {
            "matchScore": number,
            "keywordsFound": string[],
            "keywordsMissing": string[],
            "roleFit": string,
            "criticalGaps": string[],
            "tailoringSuggestions": string[],
            "executiveSummary": string,
            "tailoredResumeContent": string,
            "sectionChanges": [
              {
                "section": "Summary" | "Experience" | "Skills" | "Projects",
                "changeType": "add" | "modify" | "remove" | "rewrite",
                "originalText": string,
                "suggestedText": string
              }
            ]
          }
        `;

        // 4. Generate AI Content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text().trim();
        
        let analysis;
        try {
            const start = textResponse.indexOf("{");
            const end = textResponse.lastIndexOf("}");
            if (start === -1 || end === -1) throw new Error("No JSON object found in response");
            const jsonString = textResponse.substring(start, end + 1);
            analysis = JSON.parse(jsonString);
        } catch {
            console.error("AI returned malformed JSON:", textResponse);
            return NextResponse.json({ 
                error: "Failed to parse AI analysis. Please try again."
            }, { status: 500 });
        }

        // 5. Atomic Update: Use Credits & Save Optimization
        await db.transaction(async (tx) => {
            await tx.update(userTable)
                .set({ credits: sql`${userTable.credits} - 1` })
                .where(eq(userTable.id, authCtx.user.id));

            await tx.insert(atsTable).values({
                id: crypto.randomUUID(),
                userId: authCtx.user.id,
                resumeId: resumeId,
                jobDescription: jobDescription,
                matchScore: analysis.matchScore,
                feedback: analysis,
                createdAt: new Date(),
            });

            if (applicationId) {
                await tx.update(applicationsTable)
                    .set({
                        selectedResumeId: resumeId,
                        status: "Tailoring",
                        jobDescription: jobDescription,
                        updatedAt: new Date()
                    })
                    .where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, authCtx.user.id)));

                const sectionChanges = Array.isArray(analysis.sectionChanges) ? analysis.sectionChanges : [];
                for (const change of sectionChanges) {
                    if (change.suggestedText) {
                        await tx.insert(applicationChangesTable).values({
                            id: crypto.randomUUID(),
                            applicationId: applicationId,
                            userId: authCtx.user.id,
                            section: change.section || "General",
                            changeType: change.changeType || "modify",
                            originalText: change.originalText || null,
                            suggestedText: change.suggestedText,
                            userEdits: null,
                            status: "pending",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }
                }
            }

            if (saveAsVersion) {
                await tx.insert(resumeVersionsTable).values({
                    id: crypto.randomUUID(),
                    userId: authCtx.user.id,
                    resumeId: resumeId,
                    title: `${resume.title} - ${company || "Tailored Version"}`,
                    company: company || null,
                    targetRole: targetRole || null,
                    jobDescription: jobDescription,
                    content: analysis.tailoredResumeContent || resume.content,
                    matchScore: analysis.matchScore,
                    feedback: analysis,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        });

        return NextResponse.json({ success: true, analysis });

    } catch (error: unknown) {
        return handleApiError(error, "POST /api/ai/tailor");
    }
}
