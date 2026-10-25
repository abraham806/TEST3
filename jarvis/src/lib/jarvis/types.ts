export type AppStatus =
  | "offline"
  | "connecting"
  | "connected"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export interface Transcript {
  id: string;
  role: "user" | "agent";
  text: string;
  at: number;
}

export const STATUS_LABELS: Record<AppStatus, string> = {
  offline: "Hors ligne",
  connecting: "Connexion…",
  connected: "Connecté",
  listening: "Écoute",
  thinking: "Réflexion",
  speaking: "Parle",
  error: "Erreur",
};
