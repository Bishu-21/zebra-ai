"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiCloseLine,
  RiDeleteBin6Line,
  RiExpandDiagonalLine,
  RiMicFill,
  RiMicOffLine,
  RiSendPlane2Line,
  RiStopCircleLine,
  RiVoiceprintLine,
  RiVolumeUpLine,
} from "react-icons/ri";
import { useZebu, ZEBU_LISTEN_REQUEST_EVENT } from "@/context/ZebuContext";
import { useZebuKeyboard } from "@/hooks/useZebuKeyboard";
import { useZebuLive } from "@/hooks/useZebuLive";
import { useZebuWakeWord } from "@/hooks/useZebuWakeWord";
import { ZebuVoiceOrb } from "./ZebuVoiceOrb";
import { ZebuDisplayCard } from "./ZebuDisplayCard";
import type { ZebuDisplayCard as Card, ZebuPlan } from "@/lib/zebu-contract";

type Message = { role: "user" | "assistant"; content: string; cards?: Card[]; followUp?: string[] };

const welcome: Message = {
  role: "assistant",
  content: "Hi, I’m Zebu. I can search your workspace, check deadlines, create drafts, and update applications.",
};

export function ZebuAssistant() {
  const router = useRouter();
  const zebu = useZebu();
  const endRef = useRef<HTMLDivElement | null>(null);
  const committedResponseTurn = useRef(0);
  const committedTranscriptTurn = useRef(-1);
  const submissionRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  const executeAction = useCallback((action: Extract<ZebuPlan["action"], { type: "navigate" | "open_tool" }>) => {
    if (action.type === "navigate") {
      router.push(action.route);
      return;
    }
    sessionStorage.setItem("zebu:pending-tool", action.tool);
    if (zebu.pathname !== "/dashboard") router.push("/dashboard");
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(`zebu:open-${action.tool}`)), 450);
  }, [router, zebu.pathname]);

  const addCards = useCallback((cards: Card[]) => {
    setMessages((items) => [...items, { role: "assistant", content: "Your workspace is up to date.", cards }]);
    setExpanded(true);
  }, []);

  const live = useZebuLive({ onAction: executeAction, onCards: addCards });
  const handleWake = useCallback(() => {
    setExpanded(false);
    zebu.open(true);
  }, [zebu]);
  const wake = useZebuWakeWord({ paused: zebu.isOpen, onWake: handleWake });
  const primeAudio = live.primeAudio;
  const startListening = live.startListening;
  const stopListening = live.stopListening;
  const pauseWake = wake.pause;
  const toggleWakeWord = wake.toggle;

  const beginListening = useCallback(() => {
    pauseWake();
    primeAudio();
    const start = () => { void startListening().catch(() => undefined); };
    if (wake.enabled) window.setTimeout(start, 140);
    else start();
  }, [pauseWake, primeAudio, startListening, wake.enabled]);

  const toggleWake = useCallback(() => {
    primeAudio();
    toggleWakeWord();
  }, [primeAudio, toggleWakeWord]);

  useEffect(() => {
    window.addEventListener(ZEBU_LISTEN_REQUEST_EVENT, beginListening);
    return () => window.removeEventListener(ZEBU_LISTEN_REQUEST_EVENT, beginListening);
  }, [beginListening]);

  useEffect(() => {
    if (live.transcript) setInput(live.transcript);
  }, [live.transcript]);
  useEffect(() => {
    const text = live.transcript.trim();
    const responseStarted = Boolean(live.responseText.trim());
    if (!text || !responseStarted || committedTranscriptTurn.current === live.turnCount) return;
    committedTranscriptTurn.current = live.turnCount;
    setMessages((items) => [...items, { role: "user", content: text }]);
    setInput("");
  }, [live.responseText, live.transcript, live.turnCount]);
  useEffect(() => {
    const text = live.responseText.trim();
    if (text && live.turnCount > committedResponseTurn.current) {
      committedResponseTurn.current = live.turnCount;
      setMessages((items) => [...items, { role: "assistant", content: text }]);
    }
  }, [live.responseText, live.turnCount]);

  const sendFallback = useCallback(async (text: string) => {
    const history = messages.slice(-20).map(({ role, content }) => ({ role, content }));
    const response = await fetch("/api/zebu/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history, currentPage: zebu.pathname }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Zebu could not complete that request.");
    const plan = data as ZebuPlan;
    setMessages((items) => [...items, { role: "assistant", content: plan.spokenResponse, cards: plan.displayCards, followUp: plan.followUp }]);
    if (plan.action.type === "navigate" || plan.action.type === "open_tool") executeAction(plan.action);
  }, [executeAction, messages, zebu.pathname]);

  const sendText = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || submissionRef.current) return;
    submissionRef.current = text;
    committedTranscriptTurn.current = live.turnCount;
    setMessages((items) => [...items, { role: "user", content: text }]);
    setInput("");
    setFallbackError(null);
    try {
      await live.sendText(text);
    } catch {
      try { await sendFallback(text); }
      catch (caught) { setFallbackError(caught instanceof Error ? caught.message : "Zebu is unavailable."); }
    } finally {
      submissionRef.current = null;
    }
  }, [live, sendFallback]);

  const close = useCallback(() => {
    live.close();
    setExpanded(false);
    zebu.close();
  }, [live, zebu]);

  useZebuKeyboard({ isOpen: zebu.isOpen, toggle: zebu.toggle, close, primeAudio, startListening, stopListening });
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, live.state, live.responseText]);

  const submit = (event: FormEvent) => { event.preventDefault(); live.primeAudio(); void sendText(input); };
  const statusText = live.state === "connecting" ? "Connecting…"
    : live.state === "listening" ? "Listening"
      : live.state === "processing" ? "Working on it…"
        : live.state === "speaking" ? "Speaking · tap to interrupt"
          : live.state === "error" ? "Voice needs attention"
            : "Ready when you are";
  const latestFollowUps = [...messages].reverse().find((message) => message.followUp?.length)?.followUp ?? zebu.suggestions;
  const compactText = live.responseText.trim() || live.transcript.trim() || messages.at(-1)?.content || welcome.content;
  const wakeLabel = !wake.supported ? "Wake word unavailable"
    : wake.enabled ? (zebu.isOpen ? "Wake word paused" : "Say “Hey Zebu”")
      : "Enable “Hey Zebu”";
  const wakeStatus = !wake.supported ? "Hey Zebu unavailable"
    : !wake.enabled ? "Hey Zebu off"
      : zebu.isOpen ? "Hey Zebu paused while this panel is open"
        : wake.state === "error" ? "Hey Zebu reconnecting"
          : "Hey Zebu listening";
  const micDisabled = live.state === "processing";
  const handleMic = () => {
    if (live.state === "connecting") live.cancelPending();
    else if (live.state === "listening") stopListening();
    else beginListening();
  };
  const microphoneStatus = live.microphonePermission === "granted" ? "Microphone allowed · live tool execution"
    : live.microphonePermission === "denied" ? "Microphone denied by Chrome or Windows"
      : "Natural voice · live tool execution";

  return <>
    {zebu.isOpen ? (
      <div className="zebu-surface">
        <section className={`zebu-panel ${expanded ? "zebu-panel--expanded" : "zebu-panel--compact"}`} aria-label="Zebu live voice assistant" role="dialog">
          <header className="zebu-panel__header">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="zebu-mark"><RiVoiceprintLine size={17} /></span>
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-none tracking-tight">Zebu</h2>
                <p className="mt-1 truncate text-[0.68rem] font-medium text-neutral-400">Workspace assistant · Live voice</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={toggleWake} className={`zebu-icon-button ${wake.enabled ? "zebu-icon-button--active" : ""}`} aria-label={wakeLabel} title={wake.error ?? wakeLabel}>
                {wake.enabled ? <RiVoiceprintLine size={17} /> : <RiMicOffLine size={17} />}
              </button>
              <button type="button" onClick={() => setExpanded((value) => !value)} className="zebu-icon-button" aria-label={expanded ? "Use compact view" : "Open transcript"}>
                <RiExpandDiagonalLine size={17} />
              </button>
              {expanded ? <button type="button" onClick={() => setMessages([welcome])} className="zebu-icon-button" aria-label="Clear conversation"><RiDeleteBin6Line size={16} /></button> : null}
              <button type="button" onClick={close} className="zebu-icon-button" aria-label="Close Zebu"><RiCloseLine size={19} /></button>
            </div>
          </header>

          {!expanded ? (
            <div className="zebu-compact">
              <div className="zebu-compact__voice">
                <ZebuVoiceOrb state={live.state} volume={live.audioLevel} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-neutral-900">{statusText}</p>
                  <p className="zebu-compact__transcript" aria-live="polite">{compactText}</p>
                </div>
              </div>
              {live.error ? <button type="button" onClick={() => setExpanded(true)} className="zebu-inline-error">{live.error} Open text mode</button> : null}
              <div className="zebu-compact__controls">
                <span className="text-[0.64rem] text-neutral-500">{wake.enabled ? "“Hey Zebu” resumes when this closes" : "Hold Space or tap the mic"}</span>
                <button type="button" onClick={handleMic} disabled={micDisabled} className={`zebu-mic ${live.state === "listening" ? "zebu-mic--live" : ""}`} aria-label={live.state === "connecting" ? "Cancel voice connection" : live.state === "listening" ? "Stop listening" : live.state === "speaking" ? "Interrupt and speak" : "Start listening"}>
                  {live.state === "listening" ? <RiStopCircleLine size={20} /> : <RiMicFill size={18} />}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="zebu-expanded-status">
                <ZebuVoiceOrb state={live.state} volume={live.audioLevel} />
                <div><p className="text-xs font-bold text-neutral-800">{statusText}</p><p className="mt-0.5 text-[0.63rem] text-neutral-500">{microphoneStatus} · {wakeStatus}</p></div>
              </div>
              <div className="custom-scrollbar zebu-thread" aria-live="polite">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={message.role === "user" ? "zebu-message zebu-message--user" : "zebu-message zebu-message--assistant"}>
                    {message.content}
                    {message.cards?.length ? <div className="mt-3 grid gap-2">{message.cards.map((card) => <ZebuDisplayCard key={`${card.kind}-${card.id}`} card={card} onOpen={(href) => router.push(href)} />)}</div> : null}
                  </div>
                ))}
                {live.responseText && live.state !== "idle" ? <div className="zebu-message zebu-message--assistant">{live.responseText}</div> : null}
                {live.state === "processing" || live.state === "connecting" ? <div className="zebu-working"><span />{statusText}</div> : null}
                {live.error || fallbackError ? <p className="zebu-error">{live.error || fallbackError} You can still type below.</p> : wake.error ? <p className="zebu-error">Wake phrase: {wake.error}</p> : null}
                <div ref={endRef} />
              </div>
              <div className="zebu-composer">
                <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
                  {latestFollowUps.map((prompt) => <button key={prompt} type="button" disabled={micDisabled} onClick={() => { live.primeAudio(); void sendText(prompt); }} className="zebu-suggestion">{prompt}</button>)}
                </div>
                <form onSubmit={submit} className="flex items-center gap-2">
                  <button type="button" onClick={handleMic} disabled={micDisabled} className={`zebu-mic zebu-mic--large ${live.state === "listening" ? "zebu-mic--live" : ""}`} aria-label={live.state === "connecting" ? "Cancel voice connection" : live.state === "listening" ? "Stop listening" : "Start listening"}>
                    {live.state === "listening" ? <RiStopCircleLine size={20} /> : <RiMicFill size={18} />}
                  </button>
                  <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Zebu to work in your workspace" className="zebu-input" />
                  <button type="submit" disabled={!input.trim() || micDisabled} className="zebu-send" aria-label="Send"><RiSendPlane2Line /></button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    ) : (
      <div className="zebu-launcher">
        <button type="button" onClick={() => zebu.open(true)} className="zebu-fab" aria-label="Open Zebu and start listening"><RiVolumeUpLine size={17} /><span>Talk to Zebu</span></button>
        <button type="button" onClick={toggleWake} className={`zebu-wake-toggle ${wake.enabled ? "zebu-wake-toggle--on" : ""}`} aria-label={wakeLabel} title={wake.error ?? `${wakeLabel}. Works while this tab is open.`}>
          <span className="zebu-wake-toggle__dot" />
          <span>{wake.enabled ? "Hey Zebu on" : "Hey Zebu"}</span>
        </button>
      </div>
    )}
  </>;
}
