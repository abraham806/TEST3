import type { OrbTheme } from "./types";

export const JARVIS_THEME: OrbTheme = {
  id: "jarvis",
  label: "Jarvis",
  core: "#020b18",
  primary: "#00c8ff",
  secondary: "#1446ff",
  rim: "#7ff4ff",
  cool: "#5a8cff",
  hot: "#e8fdff",
  glow: "#00b4ff",
};

export const ORB_THEMES: Record<string, OrbTheme> = {
  [JARVIS_THEME.id]: JARVIS_THEME,
};

export const DEFAULT_THEME = JARVIS_THEME;
