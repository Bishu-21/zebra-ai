type StylesheetLink = HTMLLinkElement & { _p?: Promise<unknown> };

const observed = new WeakSet<Promise<unknown>>();
const reportedHrefs = new Set<string>();

function stylesheetPromise(node: Node): Promise<unknown> | null {
    if (typeof HTMLLinkElement === "undefined" || !(node instanceof HTMLLinkElement)) return null;
    if (node.rel !== "stylesheet") return null;
    const pending = (node as StylesheetLink)._p;
    if (!pending || typeof pending.then !== "function") return null;
    return pending;
}

function reportStylesheetFailure(reason: unknown, fallback: HTMLLinkElement) {
    const link = reason instanceof Event && reason.target instanceof HTMLLinkElement ? reason.target : fallback;
    if (!link.isConnected) return;
    const href = link.getAttribute("href");
    if (!href || reportedHrefs.has(href)) return;
    reportedHrefs.add(href);
    console.warn(`Stylesheet failed to load: ${href}`);
}

function watchStylesheetLink(node: Node) {
    const pending = stylesheetPromise(node);
    if (!pending || observed.has(pending) || !(node instanceof HTMLLinkElement)) return;
    observed.add(pending);
    const link = node;
    pending.catch((reason: unknown) => {
        try {
            reportStylesheetFailure(reason, link);
        } catch {
            // Reporting a failed stylesheet must not create another rejection.
        }
    });
}

/** Attach handlers to React's stylesheet promises before the browser reports them as unhandled. */
export function installStylesheetRejectionGuard(): () => void {
    if (typeof document === "undefined") return () => undefined;

    const visit = (node: Node) => {
        watchStylesheetLink(node);
        if (node instanceof Element) node.querySelectorAll('link[rel="stylesheet"]').forEach(watchStylesheetLink);
    };

    const head = document.head;
    if (!head) return () => undefined;
    visit(head);
    const observer = new MutationObserver((records) => {
        for (const record of records) record.addedNodes.forEach(visit);
    });
    observer.observe(head, { childList: true, subtree: true });
    return () => observer.disconnect();
}
