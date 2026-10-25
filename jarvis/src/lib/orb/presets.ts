import type { OrbParams, OrbState } from "./types";

export const ORB_PRESETS: Record<OrbState, OrbParams> = {
  // Slow breathing, dim.
  idle: {
    displace: 0.028,
    displaceAudio: 0,
    frequency: 1.3,
    speed: 0.22,
    swirl: 0,
    brightness: 0.45,
    brightnessAudio: 0,
    halo: 0.32,
    haloAudio: 0,
    pulseAudio: 0,
    breath: 0.025,
    tint: 0,
    audioSource: 0,
  },
  // Ripples following the user's voice, colder colours.
  listening: {
    displace: 0.05,
    displaceAudio: 0.32,
    frequency: 2.4,
    speed: 0.55,
    swirl: 0,
    brightness: 0.7,
    brightnessAudio: 0.35,
    halo: 0.45,
    haloAudio: 0.35,
    pulseAudio: 0.04,
    breath: 0.01,
    tint: -1,
    audioSource: 0,
  },
  // Internal vortex while a tool / search is running.
  thinking: {
    displace: 0.06,
    displaceAudio: 0,
    frequency: 1.8,
    speed: 0.9,
    swirl: 1,
    brightness: 0.78,
    brightnessAudio: 0,
    halo: 0.5,
    haloAudio: 0,
    pulseAudio: 0,
    breath: 0.015,
    tint: 0,
    audioSource: 1,
  },
  // Strong pulses, intense halo, brighter.
  speaking: {
    displace: 0.06,
    displaceAudio: 0.42,
    frequency: 1.7,
    speed: 0.7,
    swirl: 0.15,
    brightness: 0.95,
    brightnessAudio: 0.6,
    halo: 0.7,
    haloAudio: 1.1,
    pulseAudio: 0.13,
    breath: 0.01,
    tint: 1,
    audioSource: 1,
  },
};

export const ORB_STATE_LABELS: Record<OrbState, string> = {
  idle: "Repos",
  listening: "Écoute",
  thinking: "Réflexion",
  speaking: "Parole",
};
