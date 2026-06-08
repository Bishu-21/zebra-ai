import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";


const handler = toNextJsHandler(auth);

export const GET = async (req: Request) => {
    try {
        return await handler.GET(req);
    } catch (error) {
        console.error("Auth GET Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        return await handler.POST(req);
    } catch (error) {
        console.error("Auth POST Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};

