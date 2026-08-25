"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ZebuVoiceState = "idle" | "listening" | "processing" | "speaking" | "error";
type RecognitionEvent = Event & { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> };
type Recognition = { continuous: boolean; interimResults: boolean; lang: string; start(): void; stop(): void; abort(): void; onresult: ((event: RecognitionEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionConstructor = new () => Recognition;

declare global { interface Window { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor } }

export function useZebuVoice(onFinalTranscript: (text: string) => void) {
  const recognition = useRef<Recognition | null>(null);
  const analyserFrame = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const finalHandler = useRef(onFinalTranscript);
  const [state, setState] = useState<ZebuVoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [volume, setVolume] = useState(0);
  const supported = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  useEffect(() => { finalHandler.current = onFinalTranscript; }, [onFinalTranscript]);

  const stopMeter = useCallback(() => { if (analyserFrame.current) cancelAnimationFrame(analyserFrame.current); stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; setVolume(0); }, []);
  const stopListening = useCallback(() => { recognition.current?.stop(); stopMeter(); setState((value) => value === "listening" ? "idle" : value); }, [stopMeter]);
  const stopSpeaking = useCallback(() => { window.speechSynthesis?.cancel(); setState("idle"); }, []);

  const startListening = useCallback(async () => {
    stopSpeaking();
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) { setState("error"); return; }
    recognition.current?.abort();
    const instance = new Constructor();
    instance.continuous = false; instance.interimResults = true; instance.lang = "en-IN";
    instance.onresult = (event) => {
      let text = ""; let isFinal = false;
      for (let index = 0; index < event.results.length; index += 1) { text += event.results[index]?.[0]?.transcript ?? ""; isFinal ||= Boolean(event.results[index]?.isFinal); }
      setTranscript(text.trim());
      if (isFinal && text.trim()) { setState("processing"); finalHandler.current(text.trim()); }
    };
    instance.onerror = () => { stopMeter(); setState("error"); };
    instance.onend = () => { stopMeter(); setState((value) => value === "listening" ? "idle" : value); };
    recognition.current = instance; setTranscript(""); setState("listening"); instance.start();
    try {
      const mic = await navigator.mediaDevices?.getUserMedia({ audio: true });
      if (!mic) return;
      stream.current = mic; const context = new AudioContext(); const analyser = context.createAnalyser(); analyser.fftSize = 256;
      context.createMediaStreamSource(mic).connect(analyser); const data = new Uint8Array(analyser.frequencyBinCount);
      const meter = () => { analyser.getByteFrequencyData(data); setVolume(data.reduce((sum, value) => sum + value, 0) / data.length / 255); analyserFrame.current = requestAnimationFrame(meter); }; meter();
    } catch { /* SpeechRecognition may still work when metering is unavailable. */ }
  }, [stopMeter, stopSpeaking]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) { setState("idle"); return; }
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 1.02; utterance.pitch = 0.96;
    const voice = window.speechSynthesis.getVoices().find((candidate) => /en-IN|en-GB/i.test(candidate.lang)); if (voice) utterance.voice = voice;
    utterance.onstart = () => setState("speaking"); utterance.onend = () => setState("idle"); utterance.onerror = () => setState("error"); window.speechSynthesis.speak(utterance);
  }, []);
  useEffect(() => () => { recognition.current?.abort(); stopMeter(); window.speechSynthesis?.cancel(); }, [stopMeter]);
  return { state, setState, transcript, volume, supported, startListening, stopListening, speak, stopSpeaking };
}
