import { NextResponse } from "next/server";

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 400,
        public code?: string
    ) {
        super(message);
        this.name = "AppError";
    }
}

export function handleApiError(error: unknown, context: string) {
    console.error(`[API ERROR] ${context}:`, error);

    if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.statusCode }
        );
    }

    // In production, we don't want to leak internal error messages
    const isProduction = process.env.NODE_ENV === "production";
    const errorMessage = isProduction 
        ? "An internal server error occurred" 
        : (error instanceof Error ? error.message : "An unknown error occurred");

    return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
    );
}
