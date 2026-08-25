import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-policy";
import { careerProfileUpdateSchema } from "@/lib/career-profile";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";

export async function GET() {
    const { auth, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const profile = await db.query.user.findFirst({
        where: eq(userTable.id, auth.user.id),
        columns: {
            careerStage: true,
            professionalExperienceYears: true,
            careerProfileStatus: true,
        },
    });
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
    const { auth, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const parsed = careerProfileUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid career profile" }, { status: 400 });
    }

    const professionalExperienceYears = parsed.data.careerStage === "professional"
        ? parsed.data.professionalExperienceYears ?? null
        : null;
    const [profile] = await db.update(userTable).set({
        careerStage: parsed.data.careerStage,
        professionalExperienceYears,
        careerProfileStatus: "completed",
        careerProfileCompletedAt: new Date(),
        updatedAt: new Date(),
    }).where(eq(userTable.id, auth.user.id)).returning({
        careerStage: userTable.careerStage,
        professionalExperienceYears: userTable.professionalExperienceYears,
        careerProfileStatus: userTable.careerProfileStatus,
    });
    return NextResponse.json(profile);
}

export async function DELETE() {
    const { auth, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;
    await db.update(userTable).set({
        careerProfileStatus: "dismissed",
        updatedAt: new Date(),
    }).where(eq(userTable.id, auth.user.id));
    return NextResponse.json({ careerProfileStatus: "dismissed" });
}
