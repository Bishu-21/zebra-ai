import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-policy";
import { checkRateLimit } from "@/lib/rate-limit";
import { reserveUserCredits, refundUserCredits } from "@/lib/credit-policy";
import { sanitizeSecretText } from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite" 
});

export async function POST(req: NextRequest) {
  try {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const rateCheck = checkRateLimit(`ai-parse:${authCtx.user.id}`, 10, 60000);
    if (!rateCheck.success) {
      return NextResponse.json({ 
        error: "Rate limit exceeded for AI parsing. Please wait a minute." 
      }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const validation = parseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const { text } = validation.data;
    if (text.length > 50000) {
      return NextResponse.json({ error: "Input text exceeds maximum allowed size (50,000 characters)." }, { status: 400 });
    }

    // Reserve 1 credit
    const creditCheck = await reserveUserCredits(authCtx.user.id, 1);
    if (!creditCheck.success) {
      return NextResponse.json({ error: creditCheck.error || "Insufficient credits." }, { status: 402 });
    }

    try {
      const prompt = `
        SYSTEM: You are a high-precision Resume Parsing Engine. Convert raw text into structured JSON.

        RAW TEXT:
        """
        ${text.substring(0, 30000)}
        """

        REQUIRED JSON SCHEMA (STRICT):
        {
          "basics": {
            "name": "string",
            "email": "string",
            "phone": "string",
            "summary": "Professional summary",
            "location": "City, State/Country",
            "linkedin": "url",
            "portfolio": "url"
          },
          "experience": [
            {
              "id": 1,
              "company": "string",
              "location": "string",
              "role": "string",
              "period": "string",
              "highlights": ["bullet 1", "bullet 2"],
              "techStack": "comma separated string",
              "link": "url"
            }
          ],
          "education": [
            {
              "id": 1,
              "school": "string",
              "location": "string",
              "degree": "string",
              "gpa": "string",
              "period": "string",
              "highlights": ["honors"]
            }
          ],
          "skills": [
            {
              "id": 1,
              "category": "Languages",
              "items": "comma separated string"
            }
          ],
          "projects": [
            {
              "id": 1,
              "title": "string",
              "techStack": "comma separated string",
              "link": "url",
              "highlights": ["bullet 1"]
            }
          ],
          "certifications": [
            {
              "id": 1,
              "category": "Certification",
              "items": "Name of cert"
            }
          ]
        }

        OUTPUT: Return ONLY raw JSON object.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const resultText = response.text().trim();

      const start = resultText.indexOf("{");
      const end = resultText.lastIndexOf("}");
      if (start === -1 || end === -1) {
        throw new Error("Invalid AI JSON structure returned");
      }
      const jsonString = resultText.substring(start, end + 1);
      const parsedData = JSON.parse(jsonString);

      return NextResponse.json(parsedData);
    } catch (aiErr: unknown) {
      // Refund reserved credit on AI processing failure
      await refundUserCredits(authCtx.user.id, 1);
      const sanitizedMsg = sanitizeSecretText(aiErr instanceof Error ? aiErr.message : String(aiErr));
      console.error("AI Parsing Error:", sanitizedMsg);
      return NextResponse.json({ error: "Failed to parse resume text safely. Your credit has been refunded." }, { status: 500 });
    }

  } catch (error: unknown) {
    const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
    console.error("Fatal AI Parse Error:", sanitizedMsg);
    return NextResponse.json({ error: "Internal server error during resume parsing." }, { status: 500 });
  }
}
