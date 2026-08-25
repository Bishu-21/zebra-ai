import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { executeZebuLiveTool } from "@/lib/zebu-actions";

const requestSchema = z.object({
  name: z.string().min(1).max(80),
  args: z.record(z.string(), z.unknown()).default({}),
  callId: z.string().min(1).max(200).optional(),
});

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const rate = await checkDistributedRateLimit(`zebu-live-tool:${auth.user.id}`, 60, 60_000);
  if (!rate.success) return NextResponse.json({ error: "Too many voice tool requests." }, { status: 429 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid tool request." }, { status: 400 });
  try {
    const args = parsed.data.callId ? { ...parsed.data.args, __requestId: parsed.data.callId } : parsed.data.args;
    return NextResponse.json(await executeZebuLiveTool(parsed.data.name, args, auth.user.id));
  }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Tool failed" }, { status: 400 }); }
}
