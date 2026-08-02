import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium-min";
import puppeteer, { type Browser, type HTTPRequest } from "puppeteer-core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { MAX_URL_LENGTH } from "@/lib/validation";
import { db } from "@/lib/db";
import { projectAnalyses } from "@/lib/schema";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth-policy";

const projectAnalyseSchema = z.object({
    url: z.string().url("Invalid URL").max(MAX_URL_LENGTH),
});

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

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
        let projectContent = "";
        try {
            const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/i;
            const match = url.match(githubRegex);

            if (match) {
                const owner = match[1];
                const repo = match[2].replace(/\.git$/, '').split('/')[0];
                
                console.log(`Project Proof Analyzer: Detected GitHub URL, attempting direct fetch for ${owner}/${repo}`);
                
                interface GitHubRepoInfo {
                    description?: string | null;
                    stargazers_count?: number;
                    language?: string | null;
                    topics?: string[];
                }
                let repoInfo: GitHubRepoInfo | null = null;
                try {
                    const infoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                        headers: { 'User-Agent': 'Zebra-AI' }
                    });
                    if (infoRes.ok) {
                        repoInfo = await infoRes.json();
                    }
                } catch (e) {
                    console.error("Failed to fetch repo info from GitHub API:", e);
                }

                // Try fetching README from raw content or API
                const branches = ['main', 'master'];
                const files = ['README.md', 'readme.md', 'README', 'readme'];
                let readmeText = "";
                
                for (const branch of branches) {
                    if (readmeText) break;
                    for (const file of files) {
                        try {
                            const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`);
                            if (rawRes.ok) {
                                readmeText = await rawRes.text();
                                console.log(`Successfully fetched README from raw content branch=${branch}, file=${file}`);
                                break;
                            }
                        } catch {}
                    }
                }

                if (!readmeText) {
                    try {
                        const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
                            headers: { 'User-Agent': 'Zebra-AI' }
                        });
                        if (apiRes.ok) {
                            const apiData = await apiRes.json();
                            if (apiData.content && apiData.encoding === 'base64') {
                                readmeText = Buffer.from(apiData.content, 'base64').toString('utf-8');
                                console.log("Successfully fetched README from GitHub API");
                            }
                        }
                    } catch (e) {
                        console.error("Failed to fetch README from GitHub API:", e);
                    }
                }

                if (readmeText) {
                    projectContent = `Repository: ${owner}/${repo}\n`;
                    if (repoInfo) {
                        projectContent += `Description: ${repoInfo.description || ""}\n`;
                        projectContent += `Stars: ${repoInfo.stargazers_count || 0}\n`;
                        projectContent += `Language: ${repoInfo.language || ""}\n`;
                        projectContent += `Topics: ${(repoInfo.topics || []).join(', ')}\n`;
                    }
                    projectContent += `\nREADME Content:\n${readmeText}`;
                } else if (repoInfo) {
                    projectContent = `Repository: ${owner}/${repo}\nDescription: ${repoInfo.description || ""}\nLanguage: ${repoInfo.language || ""}`;
                }
            }

            // Fallback to Puppeteer if not GitHub or direct fetch failed to retrieve content
            if (!projectContent) {
                console.log(`Project Proof Analyzer: Falling back to Puppeteer scraper for URL: ${url}`);
                const isLocal = process.env.NODE_ENV === 'development' || process.platform === 'win32';
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
                        request.abort().catch(() => { });
                    } else {
                        request.continue().catch(() => { });
                    }
                });

                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

                if (url.includes("github.com")) {
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
                    projectContent = await page.evaluate(() => {
                        const unwanted = document.querySelectorAll('script, style, nav, footer, noscript');
                        unwanted.forEach(s => (s as HTMLElement).style.display = 'none');
                        return document.body.innerText;
                    });
                }

                await browser.close();
                browser = null;
            }

            // Analyze with Gemini
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

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
                userId: authCtx.user.id,
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
