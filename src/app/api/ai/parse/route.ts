import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemini-1.5-flash" 
});

import { parseSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = parseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { text } = validation.data;

    const prompt = `
      SYSTEM: You are a high-precision Resume Parsing Engine. Your task is to take unstructured raw text from a resume and convert it into a strictly structured JSON format following the schema provided.

      RAW TEXT:
      """
      ${text}
      """

      INSTRUCTIONS:
      1. Extract all relevant information accurately.
      2. If a field is missing, use empty strings or empty arrays.
      3. For 'highlights', break down descriptive paragraphs into concise bullet points.
      4. Ensure dates follow a consistent "Month Year - Month Year" or "Year - Year" format.
      5. For skills, categorize them logically (e.g., Languages, Frameworks, Tools).
      6. MANDATORY: Maintain REVERSE CHRONOLOGICAL order for Experience and Education (most recent first).

      REQUIRED JSON SCHEMA (STRICT):
      {
        "basics": {
          "name": "string",
          "email": "string",
          "phone": "string",
          "summary": "Professional summary (short)",
          "location": "City, State/Country",
          "linkedin": "url",
          "portfolio": "url"
        },
        "experience": [
          {
            "id": number (random),
            "company": "string",
            "location": "string",
            "role": "string",
            "period": "string",
            "highlights": ["bullet 1", "bullet 2"],
            "techStack": "comma separated string of tech used",
            "link": "url"
          }
        ],
        "education": [
          {
            "id": number (random),
            "school": "string",
            "location": "string",
            "degree": "string",
            "gpa": "string",
            "period": "string",
            "highlights": ["honors", "relevant courses"]
          }
        ],
        "skills": [
          {
            "id": number (random),
            "category": "string (e.g. Languages)",
            "items": "comma separated string"
          }
        ],
        "projects": [
          {
            "id": number (random),
            "title": "string",
            "techStack": "comma separated string",
            "link": "url",
            "highlights": ["bullet 1", "bullet 2"]
          }
        ],
        "certifications": [
          {
            "id": number (random),
            "category": "Certification",
            "items": "Name of cert"
          }
        ]
      }

      OUTPUT: Return ONLY the raw JSON object. No markdown, no conversational text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text().trim();

    // Clean JSON
    const start = resultText.indexOf("{");
    const end = resultText.lastIndexOf("}");
    const jsonString = resultText.substring(start, end + 1);
    const parsedData = JSON.parse(jsonString);

    return NextResponse.json(parsedData);

  } catch (error: unknown) {
    console.error("AI Parsing Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to parse resume" }, { status: 500 });
  }
}
