"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Transcript } from "@/lib/jarvis/types";
import { CloseIcon } from "./icons";

interface HistoryPanelProps {
  open: boolean;
  messages: Transcript[];
  onClose: () => void;
}

export function HistoryPanel({ open, messages, onClose }: HistoryPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  }

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-20 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            aria-label="Historique de la conversation"
            className="glass absolute inset-y-0 right-0 z-30 flex w-full flex-col rounded-none border-y-0 border-r-0 bg-[#020a14]/95 sm:w-96"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
              <span className="hud-label">Historique</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer l'historique"
                className="rounded-full p-2 text-cyan-100/60 hover:text-cyan-50"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
              {messages.length === 0 && (
                <p className="text-sm text-cyan-100/40">Aucun échange pour l&apos;instant.</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "pl-8 text-right" : "pr-8"}>
                  <div className="hud-label mb-1">{m.role === "user" ? "Vous" : "Jarvis"}</div>
                  <p
                    className={`text-sm leading-relaxed ${
                      m.role === "user" ? "text-cyan-100/60" : "text-cyan-50/90"
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="border-t border-cyan-300/10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={logout}
                className="hud-label hover:text-cyan-50"
              >
                Se déconnecter
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
