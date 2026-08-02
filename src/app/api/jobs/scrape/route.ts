import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium-min";
import puppeteer, { type Browser, type HTTPRequest } from "puppeteer-core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { scrapeSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-policy";
import { validateUrlForSsrf } from "@/lib/ssrf";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeSecretText } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        // Rate limiting boundary (max 5 scrape requests per minute per user)
        const rateCheck = checkRateLimit(`scrape:${authCtx.user.id}`, 5, 60000);
        if (!rateCheck.success) {
            return NextResponse.json({ 
                error: "Rate limit exceeded. Please wait a minute before scraping another job URL." 
            }, { status: 429 });
        }

        const body = await req.json();
        const validation = scrapeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
        }

        const { url } = validation.data;

        // SSRF Protection
        const ssrfCheck = validateUrlForSsrf(url);
        if (!ssrfCheck.valid) {
            return NextResponse.json({ error: ssrfCheck.error }, { status: 400 });
        }

        let browser: Browser | null = null;
        try {
            const isLocal = process.env.NODE_ENV === 'development' || process.platform === 'win32';
            
            browser = await puppeteer.launch({
                args: isLocal ? ['--no-sandbox'] : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: (chromium as unknown as { defaultViewport: { width: number; height: number } }).defaultViewport || { width: 1280, height: 800 },
                executablePath: isLocal 
                    ? process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
                    : await chromium.executablePath(),
                headless: true,
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            
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
                    // Ignore errors if request was handled
                }
            });

            page.on('error', (err: Error) => {
                console.error('Puppeteer page error:', sanitizeSecretText(err.message));
            });

            // Enforce bounded navigation timeout (20s)
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

            try {
                await page.waitForSelector('main, article, .job-description, #job-description, .posting-content, [role="main"]', { timeout: 5000 });
            } catch {
                // Proceed with current DOM state
            }

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

            const pageContent = await page.evaluate(() => {
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

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

            const prompt = `
                Extract job details from the following raw text content and metadata of a job listing page (URL: ${url}):
                
                METADATA: ${JSON.stringify(metaData)}
                
                CONTENT:
                "${pageContent.substring(0, 15000)}"

                Return a valid JSON object with EXACTLY these fields:
                {
                    "company": "Extracted Company Name",
                    "position": "Extracted Job Title",
                    "salary": "Extracted salary if found, else null",
                    "location": "Extracted location, else null",
                    "jobType": "Full-time, Contract, etc., else null",
                    "description": "A brief summary of the job"
                }
            `;

            const result = await model.generateContent(prompt);
            const aiResponse = result.response.text();
            
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Failed to extract structured job data");
            
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
            const sanitizedMsg = sanitizeSecretText(err instanceof Error ? err.message : String(err));
            console.error("Scrape Operation Error:", sanitizedMsg);
            
            return NextResponse.json({ 
                error: "Failed to scrape job listing automatically.",
                suggestion: "Please try copying and pasting the job details manually if URL scraping fails."
            }, { status: 500 });
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch {
                    // Ignore cleanup error
                }
            }
        }
    } catch (outerError: unknown) {
        const sanitizedMsg = sanitizeSecretText(outerError instanceof Error ? outerError.message : String(outerError));
        console.error("Fatal Scrape Error:", sanitizedMsg);
        return NextResponse.json({ 
            error: "Internal server error during scraping operation."
        }, { status: 500 });
    }
}
