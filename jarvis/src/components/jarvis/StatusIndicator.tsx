"use client";

import { AnimatePresence, motion } from "framer-motion";
import { STATUS_LABELS, type AppStatus } from "@/lib/jarvis/types";

const DOT: Record<AppStatus, string> = {
  offline: "bg-cyan-100/30",
  connecting: "bg-cyan-300 animate-pulse",
  connected: "bg-cyan-300",
  listening: "bg-sky-300",
  thinking: "bg-indigo-300 animate-pulse",
  speaking: "bg-cyan-100 shadow-[0_0_10px_2px_rgba(103,232,249,0.7)]",
  error: "bg-rose-400",
};

export function StatusIndicator({ status }: { status: AppStatus }) {
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <span className={`h-1.5 w-1.5 rounded-full transition-colors ${DOT[status]}`} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.25 }}
          className={`hud-label ${status === "error" ? "text-rose-300/80" : ""}`}
        >
          {STATUS_LABELS[status]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
