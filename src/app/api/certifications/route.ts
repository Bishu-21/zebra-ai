import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certifications as certificationsTable } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";
import { requireAuth, isTestStoreActive, notFoundResponse } from "@/lib/auth-policy";
import { testStore } from "@/lib/test-store";

const createCertSchema = z.object({
    title: z.string().min(1, "Title is required"),
    issuer: z.string().min(1, "Issuer is required"),
    issueDate: z.string().optional(),
    credentialUrl: z.url().or(z.literal("")).optional(),
    skills: z.array(z.string()).optional(),
});

export async function GET() {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        if (isTestStoreActive()) {
            const items = Array.from(testStore.certifications.values())
                .filter(c => c.userId === authCtx.user.id)
                .map(c => ({
                    id: c.id,
                    userId: c.userId,
                    title: c.name || "Certification",
                    issuer: "Test Issuer",
                    issueDate: new Date().toISOString(),
                    credentialUrl: null,
                    skills: [],
                }));
            return NextResponse.json({ certifications: items });
        }

        const items = await db.query.certifications.findMany({
            where: eq(certificationsTable.userId, authCtx.user.id),
            orderBy: [desc(certificationsTable.createdAt)],
        });

        return NextResponse.json({ certifications: items });
    } catch (error: unknown) {
        return handleApiError(error, "GET /api/certifications");
    }
}

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const parsed = createCertSchema.parse(body);

        const id = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date();

        const certPayload = {
            id,
            userId: authCtx.user.id,
            title: parsed.title,
            issuer: parsed.issuer,
            issueDate: parsed.issueDate ? new Date(parsed.issueDate) : null,
            credentialUrl: parsed.credentialUrl || null,
            skills: parsed.skills || [],
            createdAt: now,
            updatedAt: now,
        };

        if (isTestStoreActive()) {
            testStore.certifications.set(id, {
                id,
                userId: authCtx.user.id,
                name: parsed.title,
            });
            return NextResponse.json({ certification: certPayload });
        }

        const [newCert] = await db.insert(certificationsTable).values(certPayload).returning();

        return NextResponse.json({ certification: newCert });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues?.[0]?.message || "Validation failed" }, { status: 400 });
        }
        return handleApiError(error, "POST /api/certifications");
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Certification ID required" }, { status: 400 });
        }

        if (isTestStoreActive()) {
            const existing = testStore.certifications.get(id);
            if (!existing || existing.userId !== authCtx.user.id) {
                return notFoundResponse("Certification");
            }
            testStore.certifications.delete(id);
            return NextResponse.json({ success: true });
        }

        const [deleted] = await db.delete(certificationsTable).where(
            and(
                eq(certificationsTable.id, id),
                eq(certificationsTable.userId, authCtx.user.id)
            )
        ).returning({ id: certificationsTable.id });

        if (!deleted) {
            return notFoundResponse("Certification");
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, "DELETE /api/certifications");
    }
}
