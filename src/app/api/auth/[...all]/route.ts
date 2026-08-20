import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { executeWithDbRetry, sanitizeSecretText } from "@/lib/db";

const handler = toNextJsHandler(auth);

export const GET = async (req: Request) => {
    try {
        return await executeWithDbRetry(
            () => handler.GET(req),
            3,
            200
        );
    } catch (error) {
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Auth GET Error:", sanitizedMsg);
        return new Response("Internal Server Error", { status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        return await executeWithDbRetry(
            () => handler.POST(req),
            3,
            200
        );
    } catch (error) {
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Auth POST Error:", sanitizedMsg);
        return new Response("Internal Server Error", { status: 500 });
    }
};
