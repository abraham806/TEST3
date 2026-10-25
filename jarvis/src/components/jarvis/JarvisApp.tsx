"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useState } from "react";
import OrbStage from "@/components/orb/OrbStage";
import { useJarvis } from "@/hooks/useJarvis";
import { HistoryPanel } from "./HistoryPanel";
import { CloseIcon, HangUpIcon, HistoryIcon, MicIcon, MicOffIcon } from "./icons";
import { StatusIndicator } from "./StatusIndicator";
import { Subtitles } from "./Subtitles";

const ROUND_BUTTON =
  "glass flex h-12 w-12 items-center justify-center rounded-full text-cyan-50/80 transition-colors hover:text-cyan-50";

function JarvisInterface() {
  const jarvis = useJarvis();
  const [historyOpen, setHistoryOpen] = useState(false);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);
  const { appStatus, connected, start } = jarvis;
  const canStart = !connected && appStatus !== "connecting";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#01040a] text-cyan-50">
      <div className="absolute inset-0">
        <OrbStage
          state={jarvis.orbState}
          volumes={jarvis.volumes}
          onActivate={canStart ? start : undefined}
        />
      </div>

      {/* Large, accessible touch target over the orb. */}
      <button
        type="button"
        onClick={start}
        disabled={!canStart}
        aria-label="Démarrer la conversation"
        className="absolute top-[40%] left-1/2 aspect-square w-[min(56vw,40vh,340px)] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-cyan-300/40 disabled:pointer-events-none sm:top-1/2"
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:p-8">
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.9em" }}
          animate={{ opacity: 1, letterSpacing: "0.55em" }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-sm font-extralight text-cyan-100/90 sm:text-base"
        >
          J.A.R.V.I.S
        </motion.h1>
        <div className="pointer-events-auto flex items-center gap-4">
          <StatusIndicator status={appStatus} />
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-label="Afficher l'historique"
            className="rounded-full p-1.5 text-cyan-100/60 transition-colors hover:text-cyan-50"
          >
            <HistoryIcon />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {appStatus === "offline" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hud-label pointer-events-none absolute inset-x-0 top-[40%] mt-[32vw] text-center sm:top-1/2 sm:mt-[26vh]"
          >
            Touchez l&apos;orbe pour parler
          </motion.p>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-8">
        <AnimatePresence>
          {jarvis.error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="glass mx-4 flex max-w-md items-start gap-3 rounded-xl border-rose-400/25 px-4 py-3 text-sm text-rose-100/90"
            >
              <span className="flex-1">{jarvis.error}</span>
              <button
                type="button"
                onClick={jarvis.dismissError}
                aria-label="Fermer le message"
                className="text-rose-100/60 hover:text-rose-50"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Subtitles messages={jarvis.messages} />

        <AnimatePresence>
          {connected && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <button
                type="button"
                onClick={jarvis.toggleMute}
                aria-pressed={jarvis.isMuted}
                aria-label={jarvis.isMuted ? "Réactiver le micro" : "Couper le micro"}
                className={`${ROUND_BUTTON} ${jarvis.isMuted ? "text-amber-200" : ""}`}
              >
                {jarvis.isMuted ? <MicOffIcon /> : <MicIcon />}
              </button>
              <button
                type="button"
                onClick={jarvis.stop}
                aria-label="Terminer la conversation"
                className={`${ROUND_BUTTON} text-rose-200/90 hover:text-rose-100`}
              >
                <HangUpIcon />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <HistoryPanel open={historyOpen} messages={jarvis.messages} onClose={closeHistory} />
    </main>
  );
}

export default function JarvisApp() {
  return (
    <ConversationProvider>
      <MotionConfig reducedMotion="user">
        <JarvisInterface />
      </MotionConfig>
    </ConversationProvider>
  );
}
