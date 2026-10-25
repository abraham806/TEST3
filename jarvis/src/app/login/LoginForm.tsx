"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";

const ERRORS: Record<string, string> = {
  invalid_password: "Mot de passe incorrect.",
  not_configured: "Accès non configuré : la variable ACCESS_PASSWORD est manquante sur le serveur.",
};

/** Only allow same-site relative redirects. */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.replace(nextPath());
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(ERRORS[data.error ?? ""] ?? "Erreur inattendue. Réessayez.");
    } catch {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    }
    setPending(false);
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="glass relative flex w-full max-w-sm flex-col gap-6 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-display text-lg font-extralight tracking-[0.55em] text-cyan-100/90">
          J.A.R.V.I.S
        </h1>
        <p className="hud-label">Accès restreint</p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="hud-label">Mot de passe</span>
        <input
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-cyan-300/15 bg-black/30 px-4 py-3 text-base text-cyan-50 outline-none transition-colors placeholder:text-cyan-100/25 focus:border-cyan-300/50"
          placeholder="••••••••"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-rose-300/90">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !password}
        className="rounded-lg bg-cyan-400/15 py-3 text-xs tracking-[0.3em] text-cyan-50 uppercase shadow-[inset_0_0_0_1px_rgba(103,232,249,0.35)] transition-colors hover:bg-cyan-400/25 disabled:opacity-40"
      >
        {pending ? "Vérification…" : "Entrer"}
      </button>
    </motion.form>
  );
}
