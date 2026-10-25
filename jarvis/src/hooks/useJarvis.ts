"use client";

import { useConversation, type MessagePayload } from "@elevenlabs/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  describeMicError,
  describeSessionError,
  MIC_ERRORS,
  NETWORK_ERROR,
  SIGNED_URL_ERRORS,
} from "@/lib/jarvis/errors";
import type { AppStatus, Transcript } from "@/lib/jarvis/types";
import type { OrbState, VolumeSource } from "@/lib/orb/types";

// Input level above which we consider the user to be talking, and how long
// the "talking" state is held after the voice drops (avoids flicker between words).
const VOICE_THRESHOLD = 0.06;
const VOICE_HOLD_MS = 700;
// Safety net: never stay in "thinking" forever if the agent stays silent.
const REPLY_TIMEOUT_MS = 15000;

function safeVolume(fn: () => number) {
  try {
    return fn();
  } catch {
    return 0;
  }
}

export function useJarvis() {
  const router = useRouter();
  const [messages, setMessages] = useState<Transcript[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [toolPending, setToolPending] = useState(false);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);

  const onMessage = useCallback((m: MessagePayload) => {
    const text = m.message?.trim();
    if (!text) return;
    const role = m.role === "user" || m.source === "user" ? "user" : "agent";
    const id = `${role}-${m.event_id}`;
    setMessages((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i === -1) return [...prev, { id, role, text, at: Date.now() }];
      const next = prev.slice();
      next[i] = { ...next[i], text };
      return next;
    });
    setAwaitingReply(role === "user");
  }, []);

  const conversation = useConversation({
    onConnect: () => setError(null),
    onMessage,
    onModeChange: ({ mode }) => {
      if (mode === "speaking") setAwaitingReply(false);
    },
    onAgentToolRequest: () => setToolPending(true),
    onAgentToolResponse: () => setToolPending(false),
    onError: (message) => setError(describeSessionError(message)),
    onDisconnect: (details) => {
      setToolPending(false);
      setAwaitingReply(false);
      setUserSpeaking(false);
      if (details.reason === "error") setError(describeSessionError(details.message));
    },
  });

  const { status, isSpeaking, isMuted, setMuted, startSession, endSession } = conversation;
  const connected = status === "connected";

  // Stable volume source for the orb, reading the SDK every frame.
  const convRef = useRef(conversation);
  useEffect(() => {
    convRef.current = conversation;
  });
  const volumes = useMemo<VolumeSource>(
    () => ({
      getInputVolume: () => safeVolume(() => convRef.current.getInputVolume()),
      getOutputVolume: () => safeVolume(() => convRef.current.getOutputVolume()),
    }),
    [],
  );

  // Detect when the user is actually talking (drives the "Écoute" state).
  useEffect(() => {
    if (!connected) return;
    let lastLoud = 0;
    let speaking = false;
    const id = window.setInterval(() => {
      const now = performance.now();
      if (volumes.getInputVolume() > VOICE_THRESHOLD) lastLoud = now;
      const next = now - lastLoud < VOICE_HOLD_MS;
      if (next !== speaking) {
        speaking = next;
        setUserSpeaking(next);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [connected, volumes]);

  useEffect(() => {
    if (!awaitingReply) return;
    const id = window.setTimeout(() => setAwaitingReply(false), REPLY_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [awaitingReply]);

  const start = useCallback(async () => {
    if (starting || status === "connected" || status === "connecting") return;
    setError(null);
    setStarting(true);

    try {
      // Ask for the mic first so permission problems get a precise message.
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("insecure");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      setError(e instanceof Error && e.message === "insecure" ? MIC_ERRORS.insecure : describeMicError(e));
      setStarting(false);
      return;
    }

    try {
      const res = await fetch("/api/signed-url", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { signedUrl?: string; error?: string };
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok || !data.signedUrl) {
        setError(SIGNED_URL_ERRORS[data.error ?? ""] ?? SIGNED_URL_ERRORS.upstream_error);
        setStarting(false);
        return;
      }
      startSession({ signedUrl: data.signedUrl, connectionType: "websocket" });
    } catch {
      setError(NETWORK_ERROR);
    }
    setStarting(false);
  }, [starting, status, startSession, router]);

  const stop = useCallback(() => {
    endSession();
  }, [endSession]);

  const toggleMute = useCallback(() => setMuted(!isMuted), [isMuted, setMuted]);

  let appStatus: AppStatus;
  if (starting || status === "connecting") appStatus = "connecting";
  else if (connected) {
    if (toolPending || awaitingReply) appStatus = "thinking";
    else if (isSpeaking) appStatus = "speaking";
    else if (userSpeaking && !isMuted) appStatus = "listening";
    else appStatus = "connected";
  } else appStatus = error ? "error" : "offline";

  const orbState: OrbState =
    appStatus === "speaking"
      ? "speaking"
      : appStatus === "thinking" || appStatus === "connecting"
        ? "thinking"
        : appStatus === "listening"
          ? "listening"
          : "idle";

  return {
    appStatus,
    orbState,
    connected,
    error,
    dismissError: () => setError(null),
    messages,
    isMuted,
    volumes,
    start,
    stop,
    toggleMute,
  };
}
