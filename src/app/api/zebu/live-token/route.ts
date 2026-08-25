import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { buildZebuLivePrompt, ZEBU_LIVE_MODEL, ZEBU_LIVE_SESSION_MS } from "@/lib/zebu-live-prompt";
import { zebuLiveToolDeclarations } from "@/lib/zebu-actions";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isAllowedZebuRoute } from "@/lib/zebu-contract";

export const runtime = "nodejs";

const requestSchema = z.object({
  timeZone: z.string().trim().min(1).max(80).optional(),
  currentPage: z.string().trim().min(1).max(300).optional(),
  currentContext: z.string().trim().max(300).optional(),
});

function resolveTimeZone(value: string | undefined): string {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    return "UTC";
  }
}

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const rate = await checkDistributedRateLimit(`zebu-live-token:${auth.user.id}`, 60, 60 * 60 * 1000);
  if (!rate.success) return NextResponse.json({ error: "Voice session limit reached. Try again later or use text mode." }, { status: 429 });
  const apiKey = process.env.GEMINI_LIVE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "Gemini Live is not configured." }, { status: 503 });
  try {
    const requestData = requestSchema.safeParse(await request.json().catch(() => ({})));
    const timeZone = resolveTimeZone(requestData.success ? requestData.data.timeZone : undefined);
    const requestedPage = requestData.success ? requestData.data.currentPage : undefined;
    const currentPage = requestedPage && isAllowedZebuRoute(requestedPage) ? requestedPage : "/dashboard";
    const currentContext = requestData.success ? requestData.data.currentContext : undefined;
    const account = await db.query.user.findFirst({ where: eq(user.id, auth.user.id), columns: { plan: true, credits: true } });
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
    const config = {
      responseModalities: [Modality.AUDIO],
      systemInstruction: buildZebuLivePrompt({ userName: auth.user.name, plan: account?.plan ?? "Free", credits: account?.credits ?? 0, currentPage, currentContext, now: new Date(), timeZone }),
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } },
      inputAudioTranscription: {}, outputAudioTranscription: {},
      tools: [{ functionDeclarations: zebuLiveToolDeclarations }],
    };
    const now = Date.now();
    const token = await ai.authTokens.create({ config: { uses: 1, expireTime: new Date(now + ZEBU_LIVE_SESSION_MS).toISOString(), newSessionExpireTime: new Date(now + 60_000).toISOString(), liveConnectConstraints: { model: ZEBU_LIVE_MODEL, config } } });
    if (!token.name) throw new Error("Gemini did not return a token");
    return NextResponse.json({ token: token.name, model: ZEBU_LIVE_MODEL, config, expiresAt: now + ZEBU_LIVE_SESSION_MS });
  } catch (error) {
    const details = error && typeof error === "object" ? error as { name?: string; status?: number; message?: string } : {};
    console.error(`[Zebu Live] Token creation failed (${details.name ?? "UnknownError"}, status ${details.status ?? "unknown"}): ${details.message?.slice(0, 300) ?? "No provider message"}`);
    return NextResponse.json({ error: "Could not start a Gemini Live session." }, { status: 502 });
  }
}
