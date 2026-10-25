"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useState } from "react";
import OrbStage from "@/components/orb/OrbStage";
import { useSimulatedVolumes } from "@/hooks/useSimulatedVolumes";
import { ORB_STATE_LABELS } from "@/lib/orb/presets";
import type { OrbState } from "@/lib/orb/types";

const STATES: OrbState[] = ["idle", "listening", "thinking", "speaking"];

function Slider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <label className={`flex flex-col gap-2 ${disabled ? "opacity-35" : ""}`}>
      <span className="flex justify-between hud-label">
        <span>{label}</span>
        <span className="tabular-nums text-cyan-200/80">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hud-range"
      />
    </label>
  );
}

/**
 * Step 2 test bench: the orb alone, driven by simulated volumes,
 * to validate the four visual states before wiring ElevenLabs.
 */
export default function OrbLab() {
  const [state, setState] = useState<OrbState>("idle");
  const [auto, setAuto] = useState(true);
  const [input, setInput] = useState(0.4);
  const [output, setOutput] = useState(0.6);
  const [fps, setFps] = useState<number | null>(null);
  const [open, setOpen] = useState(true);

  const volumes = useSimulatedVolumes({ state, auto, input, output });

  const cycleState = () => setState((s) => STATES[(STATES.indexOf(s) + 1) % STATES.length]);

  return (
    <MotionConfig reducedMotion="user">
    <main className="relative h-dvh w-full overflow-hidden bg-[#01040a] text-cyan-50">
      <div className="absolute inset-0">
        <OrbStage state={state} volumes={volumes} onActivate={cycleState} onFps={setFps} />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-8">
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.9em" }}
          animate={{ opacity: 1, letterSpacing: "0.55em" }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-sm font-extralight text-cyan-100/90 sm:text-base"
        >
          J.A.R.V.I.S
        </motion.h1>
        <div className="hud-label text-right">
          <div>Labo orbe</div>
          <div className="tabular-nums text-cyan-200/70">{fps ?? "--"} fps</div>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 top-[40%] flex justify-center sm:top-1/2">
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45 }}
            className="hud-label mt-[32vw] text-cyan-100/70 sm:mt-[26vh]"
          >
            {ORB_STATE_LABELS[state]}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:left-auto sm:p-6"
      >
        <div className="glass w-full max-w-md rounded-2xl sm:w-80">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="hud-label flex w-full items-center justify-between px-4 py-3"
            aria-expanded={open}
          >
            <span>Simulation</span>
            <span className="text-cyan-200/70">{open ? "Masquer" : "Afficher"}</span>
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-5 px-4 pb-4">
                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-white/[0.03] p-1">
                    {STATES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setState(s)}
                        className={`rounded-lg py-2 text-[11px] tracking-[0.12em] uppercase transition-colors ${
                          state === s
                            ? "bg-cyan-400/15 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.35)]"
                            : "text-cyan-100/45 hover:text-cyan-100/80"
                        }`}
                      >
                        {ORB_STATE_LABELS[s]}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center justify-between">
                    <span className="hud-label">Voix simulée automatique</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={auto}
                      onClick={() => setAuto((a) => !a)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        auto ? "bg-cyan-400/40" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-cyan-50 transition-transform ${
                          auto ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </label>

                  <Slider label="Volume micro (moi)" value={input} onChange={setInput} disabled={auto} />
                  <Slider label="Volume agent" value={output} onChange={setOutput} disabled={auto} />

                  <p className="text-[11px] leading-relaxed text-cyan-100/40">
                    Touchez l&apos;orbe pour passer à l&apos;état suivant. En mode manuel, « Écoute »
                    suit le volume micro et « Parole » le volume agent.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </main>
    </MotionConfig>
  );
}
