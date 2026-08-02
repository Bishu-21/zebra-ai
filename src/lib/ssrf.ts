/**
 * SSRF (Server-Side Request Forgery) Protection Utility
 * 
 * Validates external URLs before fetching or scraping to prevent access
 * to private IP ranges, loopback addresses, cloud metadata services, or non-HTTP protocols.
 */

export interface SsrfValidationResult {
    valid: boolean;
    error?: string;
    url?: URL;
}

export function validateUrlForSsrf(inputUrl: string): SsrfValidationResult {
    if (!inputUrl || typeof inputUrl !== "string") {
        return { valid: false, error: "URL string is required." };
    }

    let parsed: URL;
    try {
        parsed = new URL(inputUrl.trim());
    } catch {
        return { valid: false, error: "Invalid URL format." };
    }

    // Protocol check: restrict to http and https only
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { valid: false, error: "Only HTTP and HTTPS protocols are permitted." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check for credentials in URL (e.g. http://user:pass@example.com)
    if (parsed.username || parsed.password) {
        return { valid: false, error: "URLs with inline credentials are not allowed." };
    }

    // List of forbidden patterns (Loopback, LAN, Link-Local, Cloud Metadata, Special Ranges)
    const forbiddenPatterns: RegExp[] = [
        /^localhost$/i,
        /\.local$/i,
        /\.internal$/i,
        /^127\./,                           // Loopback IPv4
        /^0\./,                             // Current network
        /^10\./,                            // Private 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,   // Private 172.16.0.0/12
        /^192\.168\./,                      // Private 192.168.0.0/16
        /^169\.254\./,                      // Link-local / AWS/GCP Metadata 169.254.169.254
        /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT
        /^::1$/,                            // IPv6 Loopback
        /^fd[0-9a-f]{2}:/i,                 // IPv6 Unique Local
        /^fe80:/i,                          // IPv6 Link-Local
        /^0000:0000:0000:0000:0000:0000:0000:0001$/i,
    ];

    if (forbiddenPatterns.some((pattern) => pattern.test(hostname))) {
        return { 
            valid: false, 
            error: "Access to internal, private, or metadata network addresses is prohibited." 
        };
    }

    return { valid: true, url: parsed };
}
