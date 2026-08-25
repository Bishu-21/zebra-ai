"use client";

import { GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ZebuDisplayCard, ZebuPlan } from "@/lib/zebu-contract";
import { withZebuTimeout } from "@/lib/zebu-live-timeout";
import { describeMicrophoneCaptureFailure, isMicrophonePermissionFailure } from "@/lib/zebu-microphone-error";

export type ZebuLiveState = "idle" | "connecting" | "listening" | "processing" | "speaking" | "error";
export type ZebuMicrophonePermission = "unknown" | "granted" | "prompt" | "denied" | "unsupported";
type LiveUiAction = Extract<ZebuPlan["action"], { type: "navigate" | "open_tool" }>;
type TokenResponse = { token: string; model: string; config: Record<string, unknown>; expiresAt: number; error?: string };
type ToolResult = { result: Record<string, unknown>; cards?: ZebuDisplayCard[]; uiAction?: LiveUiAction; error?: string };
type CaptureNodes = { source: MediaStreamAudioSourceNode; processor: AudioWorkletNode; analyser: AnalyserNode; mute: GainNode };
type FailureStage = "capture" | "audio" | "worklet" | "session";

const EPHEMERAL_TOKEN_WARNING = "Warning: Ephemeral token support is experimental and may change in future versions.";
const MICROPHONE_START_TIMEOUT_MS = 20_000;
const TOKEN_REQUEST_TIMEOUT_MS = 12_000;
const LIVE_HANDSHAKE_TIMEOUT_MS = 15_000;
const TOOL_REQUEST_TIMEOUT_MS = 30_000;
const TURN_COMPLETION_TIMEOUT_MS = 40_000;

function bytesToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

function base64ToInt16(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Int16Array(bytes.buffer);
}

async function connectWithoutKnownSdkNoise<T>(operation: () => Promise<T>): Promise<T> {
  const previousWarn = console.warn;
  const filteredWarn = (...args: unknown[]) => {
    if (args.length === 1 && args[0] === EPHEMERAL_TOKEN_WARNING) return;
    previousWarn.apply(console, args);
  };
  console.warn = filteredWarn;
  try { return await operation(); }
  finally { if (console.warn === filteredWarn) console.warn = previousWarn; }
}

async function readMicrophonePermission(): Promise<ZebuMicrophonePermission> {
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  if (!navigator.permissions?.query) return "unknown";
  try {
    const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return status.state;
  } catch {
    return "unknown";
  }
}

function describeCaptureFailure(caught: unknown, stage: FailureStage, permission: ZebuMicrophonePermission): string {
  const details = caught && typeof caught === "object" ? caught as { name?: string; message?: string } : {};
  if (stage === "session") return details.message || "Zebu Live could not connect. Text mode is still available.";
  if (stage === "capture") {
    const policyDocument = document as Document & {
      permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
      featurePolicy?: { allowsFeature?: (feature: string) => boolean };
    };
    const policy = policyDocument.permissionsPolicy ?? policyDocument.featurePolicy;
    return describeMicrophoneCaptureFailure(caught, permission, {
      secureContext: window.isSecureContext,
      policyAllowsMicrophone: policy?.allowsFeature?.("microphone") ?? true,
    });
  }
  if (stage === "audio") return "Microphone permission is allowed, but Chrome paused audio processing. Tap the mic once more to resume it.";
  return "Microphone permission is allowed, but Zebu’s audio processor did not load. Refresh the dashboard and retry.";
}

export function useZebuLive(options: { onAction: (action: LiveUiAction) => void; onCards: (cards: ZebuDisplayCard[]) => void }) {
  const sessionRef = useRef<Session | null>(null);
  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const capturePromiseRef = useRef<Promise<void> | null>(null);
  const captureAttemptRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletLoadedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const captureNodesRef = useRef<CaptureNodes | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlaybackTimeRef = useRef(0);
  const turnCompleteRef = useRef(false);
  const closingRef = useRef(false);
  const lifecycleRef = useRef(0);
  const connectionAttemptRef = useRef(0);
  const tokenAbortRef = useRef<AbortController | null>(null);
  const permissionFailureRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const turnTimeoutRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [state, setState] = useState<ZebuLiveState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [microphonePermission, setMicrophonePermission] = useState<ZebuMicrophonePermission>("unknown");

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext();
      workletLoadedRef.current = false;
    }
    return audioContextRef.current;
  }, []);

  const primeAudio = useCallback(() => {
    if (typeof AudioContext === "undefined") return;
    const context = getAudioContext();
    if (context.state === "suspended") void context.resume().catch(() => undefined);
  }, [getAudioContext]);

  const stopPlayback = useCallback(() => {
    for (const source of sourcesRef.current) {
      try { source.stop(); } catch { /* The buffer already ended. */ }
    }
    sourcesRef.current.clear();
    nextPlaybackTimeRef.current = 0;
  }, []);

  const releaseCapture = useCallback(() => {
    if (meterFrameRef.current !== null) cancelAnimationFrame(meterFrameRef.current);
    meterFrameRef.current = null;
    if (captureNodesRef.current) {
      captureNodesRef.current.processor.port.onmessage = null;
      for (const node of Object.values(captureNodesRef.current)) {
        try { node.disconnect(); } catch { /* The node is already disconnected. */ }
      }
    }
    captureNodesRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  const clearTurnTimeout = useCallback(() => {
    if (turnTimeoutRef.current !== null) clearTimeout(turnTimeoutRef.current);
    turnTimeoutRef.current = null;
  }, []);

  const armTurnTimeout = useCallback(() => {
    clearTurnTimeout();
    turnTimeoutRef.current = window.setTimeout(() => {
      turnTimeoutRef.current = null;
      releaseCapture();
      setError("Zebu did not finish that request in time. Retry when the workspace connection is stable, or use text mode.");
      setState("error");
    }, TURN_COMPLETION_TIMEOUT_MS);
  }, [clearTurnTimeout, releaseCapture]);

  const playAudio = useCallback(async (data: string) => {
    const context = getAudioContext();
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") throw new Error("Audio playback is paused by the browser.");
    const pcm = base64ToInt16(data);
    const audio = context.createBuffer(1, pcm.length, 24000);
    const channel = audio.getChannelData(0);
    for (let index = 0; index < pcm.length; index += 1) channel[index] = pcm[index] / 32768;
    const source = context.createBufferSource();
    source.buffer = audio;
    source.connect(context.destination);
    const start = Math.max(context.currentTime + 0.02, nextPlaybackTimeRef.current);
    source.start(start);
    nextPlaybackTimeRef.current = start + audio.duration;
    sourcesRef.current.add(source);
    source.onended = () => {
      sourcesRef.current.delete(source);
      if (turnCompleteRef.current && sourcesRef.current.size === 0) setState(streamRef.current ? "listening" : "idle");
    };
    setState("speaking");
  }, [getAudioContext]);

  const executeToolCalls = useCallback(async (message: LiveServerMessage, session: Session) => {
    if (!message.toolCall?.functionCalls?.length) return;
    setState("processing");
    const functionResponses = await Promise.all(message.toolCall.functionCalls.map(async (call) => {
      try {
        const requestAbort = new AbortController();
        const response = await withZebuTimeout(fetch("/api/zebu/tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: call.name, args: call.args ?? {}, callId: call.id }),
          signal: requestAbort.signal,
        }), TOOL_REQUEST_TIMEOUT_MS, "Workspace tool request timed out", { onTimeout: () => requestAbort.abort() });
        const data = await response.json() as ToolResult;
        if (!response.ok) throw new Error(data.error || "Tool failed");
        if (data.cards?.length) optionsRef.current.onCards(data.cards);
        if (data.uiAction) optionsRef.current.onAction(data.uiAction);
        return { id: call.id, name: call.name, response: data.result };
      } catch (caught) {
        return { id: call.id, name: call.name, response: { error: caught instanceof Error ? caught.message : "Tool failed" } };
      }
    }));
    session.sendToolResponse({ functionResponses });
    armTurnTimeout();
  }, [armTurnTimeout]);

  const connect = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    if (sessionPromiseRef.current) return sessionPromiseRef.current;
    closingRef.current = false;
    const lifecycle = lifecycleRef.current;
    const connectionAttempt = ++connectionAttemptRef.current;
    setState("connecting");
    setError(null);
    sessionPromiseRef.current = (async () => {
      const tokenAbort = new AbortController();
      tokenAbortRef.current = tokenAbort;
      const response = await withZebuTimeout(fetch("/api/zebu/live-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        signal: tokenAbort.signal,
      }), TOKEN_REQUEST_TIMEOUT_MS, "Zebu's authorization request timed out. Check your connection and retry.", {
        onTimeout: () => tokenAbort.abort(),
      });
      if (tokenAbortRef.current === tokenAbort) tokenAbortRef.current = null;
      const tokenData = await response.json() as TokenResponse;
      if (!response.ok || !tokenData.token) throw new Error(tokenData.error || "Could not authorize Gemini Live.");
      const ai = new GoogleGenAI({ apiKey: tokenData.token, httpOptions: { apiVersion: "v1alpha" } });
      let rejectHandshake: (error: Error) => void = () => undefined;
      let sessionReady = false;
      const handshakeFailure = new Promise<never>((_, reject) => { rejectHandshake = reject; });
      const sdkConnection = connectWithoutKnownSdkNoise(() => ai.live.connect({
        model: tokenData.model,
        config: tokenData.config,
        callbacks: {
          onopen: () => {
            if (connectionAttempt === connectionAttemptRef.current && lifecycle === lifecycleRef.current) {
              setState(streamRef.current ? "listening" : "idle");
            }
          },
          onmessage: (message) => {
            if (connectionAttempt !== connectionAttemptRef.current || lifecycle !== lifecycleRef.current) return;
            if (message.serverContent?.interrupted) {
              turnCompleteRef.current = false;
              stopPlayback();
              setState("listening");
            }
            const input = message.serverContent?.inputTranscription?.text;
            if (input) {
              if (turnCompleteRef.current) {
                turnCompleteRef.current = false;
                setTranscript(input);
                setResponseText("");
                setState("listening");
              } else setTranscript((value) => value + input);
            }
            const output = message.serverContent?.outputTranscription?.text;
            if (output) setResponseText((value) => value + output);
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                void playAudio(part.inlineData.data).catch(() => {
                  setError("Zebu replied, but Chrome paused audio playback. Tap the mic once to re-enable sound.");
                });
              }
            }
            if (message.toolCall) void executeToolCalls(message, liveSession);
            if (message.serverContent?.turnComplete) {
              clearTurnTimeout();
              turnCompleteRef.current = true;
              setTurnCount((value) => value + 1);
              if (sourcesRef.current.size === 0) setState(streamRef.current ? "listening" : "idle");
            }
          },
          onerror: () => {
            if (connectionAttempt !== connectionAttemptRef.current || lifecycle !== lifecycleRef.current) return;
            if (!sessionReady) {
              rejectHandshake(new Error("Gemini Live could not open a voice connection."));
              return;
            }
            clearTurnTimeout();
            releaseCapture();
            setError("Gemini Live disconnected. Tap the mic to start a new session, or use text mode.");
            setState("error");
          },
          onclose: () => {
            if (connectionAttempt !== connectionAttemptRef.current || lifecycle !== lifecycleRef.current) return;
            if (!sessionReady) {
              rejectHandshake(new Error("Gemini Live closed before the voice session was ready."));
              return;
            }
            clearTurnTimeout();
            sessionRef.current = null;
            sessionPromiseRef.current = null;
            if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            if (!closingRef.current) {
              releaseCapture();
              setError("The live session closed. Tap the mic to reconnect, or use text mode.");
              setState("error");
            }
          },
        },
      }));
      void sdkConnection.then((lateSession) => {
        if (connectionAttempt !== connectionAttemptRef.current || lifecycle !== lifecycleRef.current) lateSession.close();
      }, () => undefined);
      const liveSession = await withZebuTimeout(
        Promise.race([sdkConnection, handshakeFailure]),
        LIVE_HANDSHAKE_TIMEOUT_MS,
        "Gemini Live did not finish connecting. Check your connection and retry.",
      );
      if (closingRef.current || lifecycle !== lifecycleRef.current) {
        liveSession.close();
        throw new DOMException("Voice session cancelled", "AbortError");
      }
      sessionReady = true;
      sessionRef.current = liveSession;
      timeoutRef.current = window.setTimeout(() => {
        closingRef.current = true;
        releaseCapture();
        liveSession.close();
        sessionRef.current = null;
        sessionPromiseRef.current = null;
        timeoutRef.current = null;
        setError("The five-minute voice session ended. Tap the mic to start a new session, or keep typing below.");
        setState("error");
      }, Math.max(1_000, tokenData.expiresAt - Date.now()));
      return liveSession;
    })();
    try { return await sessionPromiseRef.current; }
    catch (caught) {
      if (connectionAttempt === connectionAttemptRef.current) {
        sessionPromiseRef.current = null;
        tokenAbortRef.current = null;
        connectionAttemptRef.current += 1;
        if (lifecycle === lifecycleRef.current && !closingRef.current) {
          setError(caught instanceof Error ? caught.message : "Could not connect to Gemini Live.");
          setState("error");
        }
      }
      throw caught;
    }
  }, [clearTurnTimeout, executeToolCalls, playAudio, releaseCapture, stopPlayback]);

  const stopListening = useCallback(() => {
    if (!streamRef.current) return;
    releaseCapture();
    sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
    if (!turnCompleteRef.current) armTurnTimeout();
    setState(turnCompleteRef.current ? "idle" : "processing");
  }, [armTurnTimeout, releaseCapture]);

  const startListening = useCallback(() => {
    if (capturePromiseRef.current) return capturePromiseRef.current;
    if (streamRef.current) {
      turnCompleteRef.current = false;
      stopPlayback();
      setState("listening");
      return Promise.resolve();
    }

    const startPromise = (async () => {
      const captureAttempt = ++captureAttemptRef.current;
      const lifecycle = lifecycleRef.current;
      let stage: FailureStage = "capture";
      closingRef.current = false;
      stopPlayback();
      turnCompleteRef.current = false;
      setTranscript("");
      setResponseText("");
      setError(null);
      permissionFailureRef.current = false;
      setState("connecting");
      let permission: ZebuMicrophonePermission = "unknown";
      void readMicrophonePermission().then(setMicrophonePermission);
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new DOMException("Microphone capture is unavailable", "NotSupportedError");
        const stream = await withZebuTimeout(
          navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } }),
          MICROPHONE_START_TIMEOUT_MS,
          "Microphone request timed out",
          { onLateResolve: (lateStream) => lateStream.getTracks().forEach((track) => track.stop()) },
        );
        if (lifecycle !== lifecycleRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        permission = await readMicrophonePermission();
        setMicrophonePermission(permission);

        stage = "audio";
        const context = getAudioContext();
        if (context.state === "suspended") await context.resume();
        if (lifecycle !== lifecycleRef.current) return;
        if (context.state !== "running") throw new Error("AudioContext did not start");

        stage = "worklet";
        if (!workletLoadedRef.current) {
          await context.audioWorklet.addModule("/zebu-pcm-capture.worklet.js");
          if (lifecycle !== lifecycleRef.current) return;
          workletLoadedRef.current = true;
        }
        const source = context.createMediaStreamSource(stream);
        const processor = new AudioWorkletNode(context, "zebu-pcm-capture");
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        const mute = context.createGain();
        mute.gain.value = 0;
        source.connect(analyser);
        source.connect(processor);
        processor.connect(mute).connect(context.destination);
        captureNodesRef.current = { source, processor, analyser, mute };
        const levels = new Uint8Array(analyser.frequencyBinCount);
        const meter = () => {
          if (!streamRef.current) return;
          analyser.getByteFrequencyData(levels);
          setAudioLevel(levels.reduce((sum, value) => sum + value, 0) / levels.length / 255);
          meterFrameRef.current = requestAnimationFrame(meter);
        };
        meter();
        processor.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
          sessionRef.current?.sendRealtimeInput({ audio: { data: bytesToBase64(event.data), mimeType: "audio/pcm;rate=16000" } });
        };

        stage = "session";
        await connect();
        if (lifecycle !== lifecycleRef.current) return;
        setState("listening");
      } catch (caught) {
        releaseCapture();
        permission = await readMicrophonePermission();
        setMicrophonePermission(permission);
        if (lifecycle === lifecycleRef.current) {
          permissionFailureRef.current = stage === "capture" && isMicrophonePermissionFailure(caught, permission);
          setError(describeCaptureFailure(caught, stage, permission));
          setState("error");
        }
      } finally {
        if (captureAttempt === captureAttemptRef.current) capturePromiseRef.current = null;
      }
    })();
    capturePromiseRef.current = startPromise;
    return startPromise;
  }, [connect, getAudioContext, releaseCapture, stopPlayback]);

  const sendText = useCallback(async (text: string) => {
    const session = await connect();
    turnCompleteRef.current = false;
    setResponseText("");
    setTranscript(text);
    setError(null);
    setState("processing");
    session.sendClientContent({ turns: text, turnComplete: true });
    armTurnTimeout();
  }, [armTurnTimeout, connect]);

  const close = useCallback(() => {
    closingRef.current = true;
    lifecycleRef.current += 1;
    connectionAttemptRef.current += 1;
    captureAttemptRef.current += 1;
    tokenAbortRef.current?.abort();
    tokenAbortRef.current = null;
    releaseCapture();
    stopPlayback();
    clearTurnTimeout();
    sessionRef.current?.close();
    sessionRef.current = null;
    sessionPromiseRef.current = null;
    capturePromiseRef.current = null;
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setError(null);
    setState("idle");
  }, [clearTurnTimeout, releaseCapture, stopPlayback]);

  const cancelPending = useCallback(() => {
    if (state !== "connecting") return;
    close();
  }, [close, state]);

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    const update = () => {
      void readMicrophonePermission().then((permission) => {
        setMicrophonePermission(permission);
        if (permission === "granted" && permissionFailureRef.current) {
          permissionFailureRef.current = false;
          setError(null);
          setState((current) => current === "error" ? "idle" : current);
        }
      });
    };
    update();
    if (navigator.permissions?.query) {
      void navigator.permissions.query({ name: "microphone" as PermissionName }).then((status) => {
        permissionStatus = status;
        status.addEventListener("change", update);
      }).catch(() => undefined);
    }
    const handleVisibility = () => { if (document.visibilityState === "visible") update(); };
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      permissionStatus?.removeEventListener("change", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => () => {
    close();
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
  }, [close]);

  return {
    state,
    audioLevel,
    transcript,
    responseText,
    turnCount,
    error,
    microphonePermission,
    primeAudio,
    connect,
    startListening,
    stopListening,
    cancelPending,
    sendText,
    close,
  };
}
