"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "low" | "high";

const SMALL_SCREEN = "(max-width: 768px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(SMALL_SCREEN);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getTier(): DeviceTier {
  const small = window.matchMedia(SMALL_SCREEN).matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  return small || coarse || fewCores ? "low" : "high";
}

/**
 * Rough GPU budget guess: phones, touch devices and low-core machines get the
 * lighter shader (one noise octave, no normal reconstruction) and fewer stars.
 */
export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(subscribe, getTier, () => "high");
}
