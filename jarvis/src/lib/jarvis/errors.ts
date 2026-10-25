export const SIGNED_URL_ERRORS: Record<string, string> = {
  unauthorized: "Session expirée. Reconnectez-vous.",
  not_configured:
    "Serveur non configuré : ELEVENLABS_API_KEY ou ELEVENLABS_AGENT_ID est manquant.",
  invalid_api_key: "Clé API ElevenLabs invalide ou sans permission sur cet agent.",
  agent_not_found: "Agent ElevenLabs introuvable. Vérifiez ELEVENLABS_AGENT_ID.",
  quota_exceeded: "Crédits ElevenLabs épuisés. Rechargez votre compte pour continuer.",
  upstream_error: "ElevenLabs ne répond pas. Réessayez dans un instant.",
};

export const MIC_ERRORS = {
  denied:
    "Accès au micro refusé. Autorisez le micro dans les réglages du navigateur, puis réessayez.",
  notFound: "Aucun micro détecté sur cet appareil.",
  busy: "Le micro est déjà utilisé par une autre application.",
  insecure: "Le micro nécessite une connexion sécurisée (HTTPS).",
  generic: "Impossible d'accéder au micro.",
};

export const CONNECTION_LOST = "Connexion perdue avec l'agent. Touchez l'orbe pour relancer.";
export const NETWORK_ERROR = "Impossible de joindre le serveur. Vérifiez votre connexion.";

/** Turns an SDK error / disconnect message into a clear French message. */
export function describeSessionError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (/quota|credit|insufficient|limit exceeded|payment/.test(m)) return SIGNED_URL_ERRORS.quota_exceeded;
  if (/permission|notallowed|microphone|getusermedia/.test(m)) return MIC_ERRORS.denied;
  return CONNECTION_LOST;
}

export function describeMicError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return MIC_ERRORS.denied;
  if (name === "NotFoundError" || name === "OverconstrainedError") return MIC_ERRORS.notFound;
  if (name === "NotReadableError" || name === "AbortError") return MIC_ERRORS.busy;
  return MIC_ERRORS.generic;
}
