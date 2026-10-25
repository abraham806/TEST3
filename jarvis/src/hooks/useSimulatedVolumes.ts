"use client";

import { useEffect, useMemo, useRef } from "react";
import type { OrbState, VolumeSource } from "@/lib/orb/types";

/** Speech-like envelope: syllables inside words inside phrases, with pauses. */
function speechEnvelope(t: number, seed: number) {
  const syllable = Math.max(0, Math.sin(t * 11 + seed)) ** 1.5;
  const word = 0.55 + 0.45 * Math.sin(t * 2.3 + seed * 2);
  const phrase = Math.sin(t * 0.7 + seed * 3) > -0.35 ? 1 : 0;
  const jitter = 0.85 + 0.15 * Math.sin(t * 37 + seed);
  return Math.min(1, syllable * word * phrase * jitter);
}

interface SimulatedOptions {
  state: OrbState;
  auto: boolean;
  input: number;
  output: number;
}

/**
 * Fake `VolumeSource` for the lab. In auto mode it generates a voice-like
 * envelope for whoever is talking in the current state; otherwise it returns
 * the slider values.
 */
export function useSimulatedVolumes(options: SimulatedOptions): VolumeSource {
  const ref = useRef(options);
  useEffect(() => {
    ref.current = options;
  });

  return useMemo<VolumeSource>(
    () => ({
      getInputVolume: () => {
        const o = ref.current;
        if (!o.auto) return o.input;
        return o.state === "listening" ? speechEnvelope(performance.now() / 1000, 0.3) : 0;
      },
      getOutputVolume: () => {
        const o = ref.current;
        if (!o.auto) return o.output;
        return o.state === "speaking" ? speechEnvelope(performance.now() / 1000, 1.7) : 0;
      },
    }),
    [],
  );
}
