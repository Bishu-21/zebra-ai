import { NextResponse } from "next/server";
import { interpretWebhookEvent, readGitHubAppEnv, verifyWebhookSignature } from "@/lib/github-app";
import { applyGitHubWebhook } from "@/lib/github-install-store";

export async function POST(request: Request) {
    const app = readGitHubAppEnv();
    if (!app) return NextResponse.json({ error: "GitHub App is not configured." }, { status: 503 });
    const raw = Buffer.from(await request.arrayBuffer());
    if (!verifyWebhookSignature(raw, request.headers.get("x-hub-signature-256"), app.webhookSecret)) {
        return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
    let payload: unknown;
    try {
        payload = JSON.parse(raw.toString("utf8"));
    } catch {
        return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }
    await applyGitHubWebhook(interpretWebhookEvent(request.headers.get("x-github-event"), payload));
    return NextResponse.json({ ok: true });
}
