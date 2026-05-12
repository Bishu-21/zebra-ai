import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import chromium from "@sparticuz/chromium-min";
import puppeteer, { type Browser, type HTTPRequest } from "puppeteer-core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { MAX_URL_LENGTH } from "@/lib/validation";
import { db } from "@/lib/db";
import { projectAnalyses } from "@/lib/schema";
import crypto from "crypto";

const projectAnalyseSchema = z.object({
    url: z.string().url("Invalid URL").max(MAX_URL_LENGTH),
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = projectAnalyseSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { url } = validation.data;

        // SSRF Protection
        try {
            const parsedUrl = new URL(url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                return NextResponse.json({ error: "Only HTTP and HTTPS protocols are allowed." }, { status: 400 });
            }
            const hostname = parsedUrl.hostname.toLowerCase();
            const privatePatterns = [/localhost$/, /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^0\./, /^169\.254\./];
            if (privatePatterns.some(pattern => pattern.test(hostname))) {
                return NextResponse.json({ error: "Private network access prohibited." }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
        }

        let browser: Browser | null = null;
        try {
            const isLocal = process.env.NODE_ENV === 'development';
            browser = await puppeteer.launch({
                args: isLocal ? ['--no-sandbox'] : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: { width: 1280, height: 800 },
                executablePath: isLocal 
                    ? process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
                    : await chromium.executablePath(),
                headless: true,
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            
            await page.setRequestInterception(true);
            page.on('request', (request: HTTPRequest) => {
                const resourceType = request.resourceType();
                if (['image', 'font', 'media'].includes(resourceType)) {
                    request.abort().catch(() => {});
                } else {
                    request.continue().catch(() => {});
                }
            });

            // Navigate
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Specific handling for GitHub
            let projectContent = "";
            if (url.includes("github.com")) {
                // Try to find README content
                try {
                    await page.waitForSelector('#readme', { timeout: 5000 });
                    projectContent = await page.evaluate(() => {
                        const readme = document.querySelector('#readme article');
                        return readme ? (readme as HTMLElement).innerText : document.body.innerText;
                    });
                } catch {
                    projectContent = await page.evaluate(() => document.body.innerText);
                }
            } else {
                // Generic page content
                projectContent = await page.evaluate(() => {
                    const unwanted = document.querySelectorAll('script, style, nav, footer, noscript');
                    unwanted.forEach(s => (s as HTMLElement).style.display = 'none');
                    return document.body.innerText;
                });
            }

            await browser.close();
            browser = null;

            // Analyze with Gemini
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
                Analyze the following project content from this URL: ${url}
                
                CONTENT:
                "${projectContent.substring(0, 15000)}"

                Evaluate the project based on these criteria:
                1. Tech Stack Identification: List all languages, frameworks, and tools detected.
                2. README Quality: Score 0-10 (structure, instructions, clarity).
                3. Deployment/Demo: Does it look like a live demo or a repository? Is there a link to the other?
                4. Professionalism: Overall impression for a recruiter.
                5. Resume Evidence: How should this be described on a resume to sound most impressive? (Action Verb + Metric + Tooling).

                Return a valid JSON object with:
                {
                    "score": number, (0-100)
                    "techStack": ["string"],
                    "readmeScore": number, (0-10)
                    "hasDemo": boolean,
                    "hasRepo": boolean,
                    "analysis": {
                        "strengths": ["string"],
                        "weaknesses": ["string"],
                        "improvements": ["string"]
                    },
                    "suggestedResumeBullet": "string",
                    "verificationStatus": "verified" | "unverified" | "partial"
                }

                Important: Do not claim to verify private code. If content is sparse, mark as partial.
                Return ONLY JSON.
            `;

            const result = await model.generateContent(prompt);
            const aiResponse = result.response.text();
            
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("AI failed to generate analysis");
            
            const analysis = JSON.parse(jsonMatch[0]);

            // Save to database
            await db.insert(projectAnalyses).values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                url: url,
                score: analysis.score,
                data: analysis,
            });

            return NextResponse.json({ success: true, analysis });

        } catch (err: unknown) {
            console.error("Project Analysis Failed:", err);
            return NextResponse.json({ error: "Analysis failed", details: String(err) }, { status: 500 });
        } finally {
            if (browser) await browser.close();
        }
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
