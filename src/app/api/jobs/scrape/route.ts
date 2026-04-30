import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import chromium from "@sparticuz/chromium-min";
import puppeteer, { type Browser, type HTTPRequest } from "puppeteer-core";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * JOB SCRAPER API
 * 
 * Scrapes job listing pages (LinkedIn, Indeed, etc.) using Puppeteer
 * and extracts relevant details using Gemini AI.
 */

import { scrapeSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = scrapeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { url } = validation.data;

        // SSRF Protection: Enforce protocol and block private/local addresses
        try {
            const parsedUrl = new URL(url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                return NextResponse.json({ error: "Only HTTP and HTTPS protocols are allowed." }, { status: 400 });
            }

            const hostname = parsedUrl.hostname.toLowerCase();
            const privatePatterns = [
                /^localhost$/,
                /^127\./,
                /^10\./,
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
                /^192\.168\./,
                /^0\./,
                /^169\.254\./, // Link-local / Metadata
                /^::1$/,
                /^fd[0-9a-f]{2}:/i, // IPv6 ULA
                /^fe80:/i, // IPv6 link-local
            ];

            if (privatePatterns.some(pattern => pattern.test(hostname))) {
                return NextResponse.json({ 
                    error: "Access to local or private network addresses is prohibited for security reasons." 
                }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
        }

        let browser: Browser | null = null;
        try {
            // 1. Launch headless browser
            const isLocal = process.env.NODE_ENV === 'development';
            
            browser = await puppeteer.launch({
                args: isLocal ? ['--no-sandbox'] : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: (chromium as unknown as { defaultViewport: { width: number; height: number } }).defaultViewport || { width: 1280, height: 800 },
                executablePath: isLocal 
                    ? process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
                    : await chromium.executablePath(),
                headless: true,
            });

            const page = await browser.newPage();
            
            // Set a realistic user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            
            // Block images and extra resources to speed up
            await page.setRequestInterception(true);
            page.on('request', (request: HTTPRequest) => {
                try {
                    const resourceType = request.resourceType();
                    if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
                        request.abort().catch(() => {});
                    } else {
                        request.continue().catch(() => {});
                    }
                } catch {
                    // Ignore errors if the request was already handled or page is closed
                }
            });

            // Handle page errors to prevent unhandled rejections
            page.on('error', (err: Error) => {
                console.error('Puppeteer page error:', err);
            });
            page.on('pageerror', (err: unknown) => {
                console.error('Puppeteer page crash:', err);
            });

            // Navigate to URL
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });

            try {
                await page.waitForSelector('main, article, .job-description, #job-description, .posting-content, [role="main"]', { timeout: 8000 });
            } catch {
                console.log("Selector timeout, proceeding with current state");
            }

            // 1. Extract metadata first (often more reliable)
            const metaData = await page.evaluate(() => {
                const getMeta = (name: string) => 
                    document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute('content');
                
                return {
                    ogTitle: getMeta('og:title'),
                    ogDescription: getMeta('og:description'),
                    ogSiteName: getMeta('og:site_name'),
                    title: document.title,
                    h1: document.querySelector('h1')?.innerText
                };
            });

            // 2. Extract visible text content, focusing on common job containers
            const pageContent = await page.evaluate(() => {
                // Focus on meaningful text regions
                const unwanted = document.querySelectorAll('script, style, nav, footer, iframe, noscript, .ad, .ads, #header, .nav, .menu, #footer');
                unwanted.forEach(s => (s as HTMLElement).style.display = 'none');
                
                const mainSelectors = [
                    'main', 'article', 
                    '.job-description', '#job-description', 
                    '.posting-content', '.description',
                    '.jobsearch-JobComponent', 
                    '.details-pane', 
                    '[data-automation-id="jobPostingDescription"]'
                ];
                
                for (const selector of mainSelectors) {
                    const el = document.querySelector(selector);
                    if (el && (el as HTMLElement).innerText.length > 200) {
                        return (el as HTMLElement).innerText;
                    }
                }
                
                return document.body.innerText;
            });

            await browser.close();
            browser = null;

            // 3. Use Gemini to extract details
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
                Extract job details from the following raw text content and metadata of a job listing page (URL: ${url}):
                
                METADATA: ${JSON.stringify(metaData)}
                
                CONTENT:
                "${pageContent.substring(0, 15000)}"

                Return a valid JSON object with EXACTLY these fields:
                {
                    "company": "Extracted Company Name",
                    "position": "Extracted Job Title",
                    "salary": "Extracted salary if found (e.g. $120k - $150k), else null",
                    "location": "Extracted location (e.g. Remote, New York, etc.), else null",
                    "jobType": "Full-time, Contract, Internship, etc., else null",
                    "description": "A very brief 1-sentence summary of the job"
                }
                Guidelines:
                - Be surgical and precise.
                - If you cannot find a field, use null. 
                - Look at the metadata first for company and position.
                - Clean up any "Apply now" or extra text from titles.
                - Only return the JSON.
            `;

            const result = await model.generateContent(prompt);
            const aiResponse = result.response.text();
            
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("AI failed to extract structured data");
            
            const jobData = JSON.parse(jsonMatch[0]);

            return NextResponse.json({ 
                success: true, 
                company: jobData.company || "",
                position: jobData.position || "",
                salary: jobData.salary || "",
                location: jobData.location || "",
                jobType: jobData.jobType || "",
                description: jobData.description || "",
                url: url
            });

        } catch (err: unknown) {
            console.error("Scrape Operation Failed:", err || "Undefined Rejection");
            const errorMessage = err instanceof Error ? err.message : String(err || "Unknown error");
            
            return NextResponse.json({ 
                error: "Failed to scrape job listing automatically.",
                details: errorMessage,
                suggestion: "Please try copying and pasting the job details manually into the form if the URL scraping continues to fail."
            }, { status: 500 });
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch {
                    console.error("Error closing browser");
                }
            }
        }
    } catch (outerError: unknown) {
        console.error("Fatal Scrape Error:", outerError || "Undefined Fatal Error");
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: outerError instanceof Error ? outerError.message : "Fatal error with no details"
        }, { status: 500 });
    }
}
