"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { containsZebuWakeWord } from "@/lib/zebu-wake-word";

type RecognitionResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type RecognitionEvent = Event & { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = Event & { error?: string };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

function getRecognitionConstructor(): RecognitionConstructor | undefined {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
}

const STORAGE_KEY = "zebu:wake-word-enabled";

async function readMicrophonePermission(): Promise<PermissionState | "unknown"> {
  if (!navigator.permissions?.query) return "unknown";
  try { return (await navigator.permissions.query({ name: "microphone" as PermissionName })).state; }
  catch { return "unknown"; }
}

export type ZebuWakeState = "off" | "starting" | "listening" | "paused" | "unsupported" | "error";

export function useZebuWakeWord(options: { paused: boolean; onWake: () => void }) {
  const recognitionRef = useRef<Recognition | null>(null);
  const retryRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const enabledRef = useRef(false);
  const startRecognitionRef = useRef<() => void>(() => undefined);
  const pausedRef = useRef(options.paused);
  const wakeHandlerRef = useRef(options.onWake);
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<ZebuWakeState>("off");
  const [lastHeard, setLastHeard] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pausedRef.current = options.paused;
    wakeHandlerRef.current = options.onWake;
  }, [options.onWake, options.paused]);

  const clearRetry = useCallback(() => {
    if (retryRef.current !== null) window.clearTimeout(retryRef.current);
    retryRef.current = null;
  }, []);

  const stopRecognition = useCallback(() => {
    clearRetry();
    const active = recognitionRef.current;
    recognitionRef.current = null;
    if (active) {
      active.onstart = null;
      active.onend = null;
      active.onerror = null;
      active.onresult = null;
      try { active.abort(); } catch { /* The browser already stopped it. */ }
    }
  }, [clearRetry]);

  const startRecognition = useCallback(() => {
    if (!enabledRef.current || pausedRef.current || document.visibilityState !== "visible" || recognitionRef.current) return;
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      setSupported(false);
      setState("unsupported");
      return;
    }

    clearRetry();
    setState("starting");
    const instance = new Constructor();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = navigator.language || "en-IN";
    instance.onstart = () => {
      retryCountRef.current = 0;
      setError(null);
      setState("listening");
    };
    instance.onresult = (event) => {
      let phrase = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        phrase += ` ${event.results[index]?.[0]?.transcript ?? ""}`;
      }
      const heard = phrase.trim();
      if (!heard) return;
      setLastHeard(heard);
      setState("listening");
      if (containsZebuWakeWord(heard)) {
        stopRecognition();
        wakeHandlerRef.current();
      }
    };
    instance.onerror = (event) => {
      recognitionRef.current = null;
      const code = event.error ?? "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") {
        enabledRef.current = false;
        setEnabled(false);
        localStorage.setItem(STORAGE_KEY, "false");
        setState("error");
        void readMicrophonePermission().then((permission) => {
          setError(permission === "granted"
            ? "Microphone access is allowed, but Chrome’s wake-word speech service did not start. Tap “Hey Zebu” to retry."
            : "Chrome is blocking microphone access for wake listening. Allow it in Site settings, then retry.");
        });
        return;
      }
      if (code === "audio-capture") {
        enabledRef.current = false;
        setEnabled(false);
        localStorage.setItem(STORAGE_KEY, "false");
        setError("Chrome could not open the microphone for wake listening. Check the selected Windows input device, then retry.");
        setState("error");
        return;
      }
      if (code === "network") {
        retryCountRef.current += 1;
        setError("Chrome’s wake-word speech service disconnected. Zebu will keep retrying while this tab is visible.");
        setState("error");
      }
    };
    instance.onend = () => {
      if (recognitionRef.current === instance) recognitionRef.current = null;
      if (!enabledRef.current) return;
      if (pausedRef.current || document.visibilityState !== "visible") {
        setState("paused");
        return;
      }
      const delay = Math.min(10_000, 500 * 2 ** Math.min(retryCountRef.current, 4));
      retryRef.current = window.setTimeout(() => startRecognitionRef.current(), delay);
    };
    recognitionRef.current = instance;
    try {
      instance.start();
    } catch {
      recognitionRef.current = null;
      retryCountRef.current += 1;
      retryRef.current = window.setTimeout(() => startRecognitionRef.current(), 700);
    }
  }, [clearRetry, stopRecognition]);

  useEffect(() => { startRecognitionRef.current = startRecognition; }, [startRecognition]);

  const disable = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
    localStorage.setItem(STORAGE_KEY, "false");
    stopRecognition();
    retryCountRef.current = 0;
    setError(null);
    setState("off");
  }, [stopRecognition]);

  const pause = useCallback(() => {
    stopRecognition();
    if (enabledRef.current) setState("paused");
  }, [stopRecognition]);

  const enable = useCallback(async () => {
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      setSupported(false);
      setState("unsupported");
      setError("Wake words need Chrome or Edge speech recognition.");
      return;
    }
    setError(null);
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      enabledRef.current = true;
      setEnabled(true);
      retryCountRef.current = 0;
      localStorage.setItem(STORAGE_KEY, "true");
      startRecognition();
    } catch {
      const permission = await readMicrophonePermission();
      setError(permission === "granted"
        ? "Microphone access is allowed, but Chrome could not start wake listening. Check the Windows input device and retry."
        : "Allow microphone access in Chrome Site settings to enable “Hey Zebu”.");
      setState("error");
    }
  }, [startRecognition]);

  const toggle = useCallback(() => {
    if (enabledRef.current) disable();
    else void enable();
  }, [disable, enable]);

  useEffect(() => {
    queueMicrotask(() => {
      const hasSupport = Boolean(getRecognitionConstructor());
      setSupported(hasSupport);
      if (!hasSupport) {
        setState("unsupported");
        return;
      }
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        enabledRef.current = true;
        setEnabled(true);
        startRecognition();
      }
    });
  }, [startRecognition]);

  useEffect(() => {
    if (!enabledRef.current) return;
    if (options.paused) {
      queueMicrotask(pause);
    } else {
      queueMicrotask(startRecognition);
    }
  }, [options.paused, pause, startRecognition]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!enabledRef.current) return;
      if (document.visibilityState === "visible" && !pausedRef.current) startRecognition();
      else {
        stopRecognition();
        setState("paused");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [startRecognition, stopRecognition]);

  useEffect(() => () => stopRecognition(), [stopRecognition]);

  return { enabled, supported, state, lastHeard, error, enable, disable, pause, toggle };
}
