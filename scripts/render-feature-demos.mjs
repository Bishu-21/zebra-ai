/**
 * Render the real React motion showcase to captioned MP4s.
 * Usage: FFMPEG_PATH=... node --import tsx scripts/render-feature-demos.mjs
 * Requires a running development server; never logs in or calls an AI provider.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import puppeteer from "puppeteer-core";
import { DEMO_FEATURES, FEATURE_DEMO_SECONDS, OVERVIEW_DEMO_SECONDS, getDemoMoment } from "../src/lib/demo-catalog.ts";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "demo");
const origin = process.env.SHOT_ORIGIN || "http://127.0.0.1:3000";
const ffmpeg = process.env.FFMPEG_PATH;
if (!ffmpeg || !fs.existsSync(ffmpeg)) throw new Error("Set FFMPEG_PATH to an installed FFmpeg executable.");
const browserPath = [process.env.CHROME_EXECUTABLE_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].filter(Boolean).find(file => fs.existsSync(file));
if (!browserPath) throw new Error("Set CHROME_EXECUTABLE_PATH to a Chromium browser.");
fs.mkdirSync(out, { recursive: true });
const only = process.argv.slice(2);
const ids = ["overview", ...DEMO_FEATURES.map(feature => feature.id)].filter(id => !only.length || only.includes(id));
if (!ids.length) throw new Error("No known demo IDs selected.");
const browser = await puppeteer.launch({ executablePath: browserPath, headless: true, args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"], defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 } });
const stamp = seconds => `00:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}.000`;
try {
    for (const id of ids) {
        const page = await browser.newPage();
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.setRequestInterception(true);
        page.on("request", request => {
            const requestUrl = new URL(request.url());
            if (requestUrl.pathname.startsWith("/api/")) {
                errors.push(`Unexpected API request: ${requestUrl.pathname}`);
                void request.abort();
            } else if (requestUrl.origin !== new URL(origin).origin && requestUrl.protocol !== "data:" && requestUrl.protocol !== "blob:") {
                void request.abort();
            } else void request.continue();
        });
        await page.goto(`${origin}/dev/feature-demo?feature=${id}`, { waitUntil: "networkidle2", timeout: 120000 });
        await page.waitForSelector('[data-demo-status="ready"]');
        await page.evaluate(() => document.fonts.ready);
        // Hide framework developer chrome in the export only.
        await page.addStyleTag({ content: "nextjs-portal { display:none !important } html,body { margin:0; padding:0; overflow:hidden }" });
        await new Promise(resolve => setTimeout(resolve, 600));
        await page.screenshot({ path: path.join(out, `${id}-poster.jpg`), type: "jpeg", quality: 88 });
        const raw = path.join(out, `${id}-raw.webm`);
        const recorder = await page.screencast({ path: raw, ffmpegPath: ffmpeg, fps: 30, quality: 22 });
        await page.evaluate(() => window.dispatchEvent(new Event("zebra-demo-play")));
        const duration = id === "overview" ? OVERVIEW_DEMO_SECONDS : FEATURE_DEMO_SECONDS;
        await page.waitForSelector('[data-demo-status="done"]', { timeout: (duration + 15) * 1000 });
        await new Promise(resolve => setTimeout(resolve, 300));
        await recorder.stop();
        await page.close();
        if (errors.length) throw new Error(`${id}: ${errors.join("; ")}`);
        const dest = path.join(out, `${id}.mp4`);
        const result = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-t", String(duration), "-vf", "fps=30,scale=1280:720:flags=lanczos", "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", dest], { encoding: "utf8", windowsHide: true });
        if (result.status !== 0) throw new Error(`MP4 encoding failed: ${result.stderr || result.error}`);
        fs.unlinkSync(raw);
        let vtt = "WEBVTT\n\n";
        const interval = id === "overview" ? 1 : 4;
        for (let second = 0; second < duration; second += interval) {
            const moment = getDemoMoment(id, second);
            vtt += `${stamp(second)} --> ${stamp(Math.min(duration, second + interval))}\n${moment.feature.title}. ${moment.caption}\n\n`;
        }
        fs.writeFileSync(path.join(out, `${id}.vtt`), vtt);
        // Preserve the legacy overview URL for existing embeds.
        if (id === "overview") {
            fs.copyFileSync(dest, path.join(out, "walkthrough.mp4"));
            fs.copyFileSync(path.join(out, `${id}.vtt`), path.join(out, "walkthrough.vtt"));
        }
        console.log(`Rendered ${id}: ${duration}s, ${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB`);
    }
} finally { await browser.close(); }
