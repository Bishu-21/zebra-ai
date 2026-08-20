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

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

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
        /^::$/,                             // IPv6 unspecified
        /^::1$/,                            // IPv6 Loopback
        /^::ffff:(?:127\.|10\.|169\.254\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/i,
        /^fd[0-9a-f]{2}:/i,                 // IPv6 Unique Local
        /^fc[0-9a-f]{2}:/i,                 // IPv6 Unique Local
        /^fe80:/i,                          // IPv6 Link-Local
        /^ff[0-9a-f]{2}:/i,                 // IPv6 Multicast
        /^2001:db8:/i,                      // IPv6 documentation range
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

function isNonPublicIpv4(address: string): boolean {
    const parts = address.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
        return true;
    }

    const [a, b, c] = parts;
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 0 && c === 0) ||
        (a === 192 && b === 0 && c === 2) ||
        (a === 192 && b === 168) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113) ||
        a >= 224
    );
}

function isNonPublicIp(address: string): boolean {
    const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
    const version = isIP(normalized);
    if (version === 4) return isNonPublicIpv4(normalized);
    if (version !== 6) return true;

    const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (mappedIpv4) return isNonPublicIpv4(mappedIpv4);

    return (
        normalized === "::" ||
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        /^fe[89ab]/.test(normalized) ||
        normalized.startsWith("ff") ||
        normalized.startsWith("2001:db8:")
    );
}

/**
 * Resolve a URL before server-side navigation so a public-looking hostname
 * cannot point Chromium at a private, loopback, link-local, or metadata IP.
 */
export async function validateResolvedUrlForSsrf(
    inputUrl: string,
    timeoutMs = 5_000,
): Promise<SsrfValidationResult> {
    const validation = validateUrlForSsrf(inputUrl);
    if (!validation.valid || !validation.url) return validation;

    const hostname = validation.url.hostname.replace(/^\[|\]$/g, "");
    if (isIP(hostname)) {
        return isNonPublicIp(hostname)
            ? { valid: false, error: "Access to non-public network addresses is prohibited." }
            : validation;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        const addresses = await Promise.race([
            lookup(hostname, { all: true, verbatim: true }),
            new Promise<never>((_, reject) => {
                timeout = setTimeout(() => reject(new Error("DNS lookup timed out")), timeoutMs);
            }),
        ]);

        if (!addresses.length || addresses.some(({ address }) => isNonPublicIp(address))) {
            return { valid: false, error: "The URL resolves to a non-public network address." };
        }
        return validation;
    } catch {
        return { valid: false, error: "The URL host could not be resolved safely." };
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
