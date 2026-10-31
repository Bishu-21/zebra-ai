type TransactionalEmail = {
    to: string;
    subject: string;
    text: string;
};

export function isTransactionalEmailConfigured(environment: NodeJS.ProcessEnv = process.env): boolean {
    return Boolean(environment.RESEND_API_KEY?.trim() && environment.EMAIL_FROM?.trim());
}

export async function sendTransactionalEmail({ to, subject, text }: TransactionalEmail): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !from) throw new Error("Transactional email is not configured");

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, text }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        // Provider responses can include addresses and message content. Keep logs generic.
        console.error(`[Transactional Email] Resend rejected a message (${response.status}).`);
        throw new Error("Could not send email");
    }
}
