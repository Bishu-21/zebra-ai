"use client";

import { FormEvent, Suspense, useCallback, useState } from "react";
import { RiChat1Line, RiCloseLine, RiSendPlane2Line } from "react-icons/ri";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ZebuVoiceOrb } from "@/components/dashboard/ZebuVoiceOrb";
import { ZebuDisplayCard } from "@/components/dashboard/ZebuDisplayCard";
import { DemoWorkspaceProvider, useDemoWorkspace } from "@/context/DemoWorkspaceContext";
import { CreditsProvider } from "@/context/CreditsContext";
import { ZebuProvider } from "@/context/ZebuContext";
import { SamplePage } from "@/components/demo/SamplePages";
import { parseZebuWorkspaceCommand } from "@/lib/zebu-local-intent";
import { getDemoMoment, hrefForDemoId, OVERVIEW_FEATURE_SECONDS, type DemoFeatureId, type DemoId } from "@/lib/demo-catalog";

const welcome = "I can open pages in your workspace. I cannot apply to jobs, post to LinkedIn, or spend credits. Try “Open resumes”.";

function SampleZebu({
    featureId,
    phase,
    localTime,
    interactive,
}: {
    featureId: DemoFeatureId | "overview";
    phase: number;
    localTime: number;
    interactive: boolean;
}) {
    const demo = useDemoWorkspace();
    const autoOpen = !interactive && featureId === "zebu" && localTime > 2.6;
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; href?: string; title?: string }[]>([
        { role: "assistant", content: welcome },
    ]);
    const expanded = interactive ? open : autoOpen && phase >= 1;
    const prompt = "Open my applications";
    const typed = !interactive && expanded ? prompt.slice(0, Math.max(0, Math.floor((localTime - 5) / 0.09))) : "";
    const replied = !interactive && phase >= 2;

    const send = (event: FormEvent) => {
        event.preventDefault();
        const text = input.trim();
        if (!text || !demo) return;
        const command = parseZebuWorkspaceCommand(text);
        setMessages((current) => [
            ...current,
            { role: "user", content: text },
            command
                ? { role: "assistant", content: `Opening ${text.replace(/^open\s+/i, "")}.`, href: command.route, title: text }
                : { role: "assistant", content: "I can open workspace pages. Try “Open resumes” or “Open applications”." },
        ]);
        setInput("");
        if (command) demo.navigate(command.route);
    };

    if (!interactive && !autoOpen) {
        return (
            <div className="pointer-events-none absolute right-4 bottom-4 z-20 lg:right-6 lg:bottom-6">
                <div className="zebu-fab zebu-fab--head">
                    <ZebuVoiceOrb state="idle" volume={0.2} />
                </div>
            </div>
        );
    }

    if (interactive && !open) {
        return (
            <div className="absolute right-4 bottom-4 z-20 lg:right-6 lg:bottom-6">
                <button type="button" className="zebu-fab zebu-fab--head" aria-label="Open Zebu" onClick={() => setOpen(true)}>
                    <ZebuVoiceOrb state="idle" volume={0.2} />
                </button>
            </div>
        );
    }

    return (
        <div className="zebu-navigation-voice absolute inset-0 z-20" style={{ position: "absolute", pointerEvents: interactive ? "auto" : "none" }}>
            <section className={`zebu-panel ${expanded ? "zebu-panel--expanded" : "zebu-panel--compact"}`}>
                <header className="zebu-panel__header">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <ZebuVoiceOrb state={replied || messages.length > 1 ? "idle" : "processing"} volume={0.25} />
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold leading-none tracking-tight">Zebu</h2>
                            <p className="zebu-panel__status">Voice or text</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <span className="zebu-icon-button"><RiChat1Line size={18} /></span>
                        {interactive ? (
                            <button type="button" className="zebu-icon-button" aria-label="Close Zebu" onClick={() => setOpen(false)}>
                                <RiCloseLine size={19} />
                            </button>
                        ) : (
                            <span className="zebu-icon-button"><RiCloseLine size={19} /></span>
                        )}
                    </div>
                </header>
                {expanded ? (
                    <>
                        <div className="zebu-thread custom-scrollbar">
                            {interactive
                                ? messages.map((message, index) => (
                                    <div key={`${message.role}-${index}`} className={`zebu-message zebu-message--${message.role}`}>
                                        {message.content}
                                        {message.href ? (
                                            <div className="mt-3 grid gap-2">
                                                <ZebuDisplayCard
                                                    card={{ id: `nav-${index}`, kind: "application", title: message.title || "Open page", subtitle: "Sample workspace", href: message.href }}
                                                    onOpen={(href) => demo?.navigate(href)}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ))
                                : (
                                    <>
                                        <div className="zebu-message zebu-message--assistant">{welcome}</div>
                                        {typed ? <div className="zebu-message zebu-message--user">{typed.slice(0, prompt.length)}</div> : null}
                                        {replied ? (
                                            <div className="zebu-message zebu-message--assistant">
                                                Opening Applications.
                                                <div className="mt-3 grid gap-2">
                                                    <ZebuDisplayCard card={{ id: "example-card", kind: "application", title: "Applications", subtitle: "View roles, deadlines, and saved progress", href: "/dashboard/job-tracker" }} onOpen={() => undefined} />
                                                </div>
                                            </div>
                                        ) : null}
                                    </>
                                )}
                        </div>
                        <div className="zebu-composer">
                            <form className="flex items-center gap-2" onSubmit={interactive ? send : (event) => event.preventDefault()}>
                                <input
                                    readOnly={!interactive}
                                    value={interactive ? input : typed.slice(0, prompt.length)}
                                    onChange={(event) => setInput(event.target.value)}
                                    placeholder="Open a page…"
                                    className="zebu-input"
                                    aria-label="Message Zebu"
                                />
                                <button type="submit" className="zebu-send" disabled={!interactive} aria-label="Send">
                                    <RiSendPlane2Line />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <p className="zebu-compact__transcript">Open a workspace page. Typing always works.</p>
                )}
            </section>
        </div>
    );
}

function SampleChrome({
    pathname,
    interactive,
    featureId,
    phase,
    localTime,
}: {
    pathname: string;
    interactive: boolean;
    featureId: DemoFeatureId | "overview";
    phase: number;
    localTime: number;
}) {
    const demo = useDemoWorkspace();
    const [navOpen, setNavOpen] = useState(false);
    const openNav = useCallback(() => setNavOpen(true), []);
    const closeNav = useCallback(() => setNavOpen(false), []);

    return (
        <CreditsProvider credits={3} plan="Free">
        <div className="demo-workspace relative flex h-full min-h-0 w-full overflow-hidden bg-background font-sans text-foreground" data-demo-feature={featureId} data-demo-path={pathname}>
            <Sidebar
                plan="Free"
                credits={3}
                userName="Jordan Hale"
                isOpen={navOpen}
                onCloseAction={closeNav}
                onOpenProfileAction={() => demo?.notifySample()}
                checkoutAvailable={false}
            />
            <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                <Header
                    userName="Jordan Hale"
                    credits={3}
                    isNavOpen={navOpen}
                    onOpenNavAction={openNav}
                    onOpenProfileAction={() => demo?.notifySample()}
                    onOpenSettingsAction={() => demo?.navigate("/dashboard/settings")}
                />
                <main
                    className="custom-scrollbar min-h-0 flex-1 overflow-y-auto"
                    inert={interactive ? undefined : true}
                    aria-hidden={interactive ? undefined : true}
                >
                    <SamplePage pathname={pathname} />
                </main>
                <SampleZebu featureId={featureId} phase={phase} localTime={localTime} interactive={interactive} />
            </div>
        </div>
        </CreditsProvider>
    );
}

export function FeatureDemoScene({
    id,
    seconds,
    pathname,
    interactive = false,
    onNavigate,
}: {
    id: DemoId;
    seconds: number;
    pathname?: string;
    interactive?: boolean;
    onNavigate?: (href: string) => void;
}) {
    const { feature, phase } = getDemoMoment(id, seconds);
    const featureTime = id === "overview" ? seconds % OVERVIEW_FEATURE_SECONDS : seconds;
    const path = pathname || hrefForDemoId(interactive && id === "overview" ? "overview" : feature.id);

    return (
        <DemoWorkspaceProvider pathname={path} interactive={interactive} onNavigate={(href) => onNavigate?.(href)}>
            <ZebuProvider>
                <Suspense fallback={null}>
                    <SampleChrome
                        pathname={path}
                        interactive={interactive}
                        featureId={id === "overview" ? feature.id : id}
                        phase={phase}
                        localTime={featureTime}
                    />
                </Suspense>
            </ZebuProvider>
        </DemoWorkspaceProvider>
    );
}
