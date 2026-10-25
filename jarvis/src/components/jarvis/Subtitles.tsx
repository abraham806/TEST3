"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Transcript } from "@/lib/jarvis/types";

function lastOf(messages: Transcript[], role: Transcript["role"]) {
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === role) return messages[i];
  return undefined;
}

/** Latest user line (small, dim) above the latest agent line (larger). */
export function Subtitles({ messages }: { messages: Transcript[] }) {
  const user = lastOf(messages, "user");
  const agent = lastOf(messages, "agent");
  // Show the user line only if it is more recent than the agent's reply or right before it.
  const showUser = user && (!agent || user.at >= agent.at - 60000);

  return (
    <div className="pointer-events-none flex w-full max-w-2xl flex-col items-center gap-3 px-5 text-center">
      <AnimatePresence mode="popLayout" initial={false}>
        {showUser && (
          <motion.p
            key={user.id + user.text.length}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="line-clamp-2 text-sm font-light text-cyan-100/45"
          >
            <span className="hud-label mr-2 text-cyan-100/35">Vous</span>
            {user.text}
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence mode="popLayout" initial={false}>
        {agent && (
          <motion.p
            key={agent.id}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="line-clamp-4 text-base leading-relaxed font-light text-cyan-50/90 sm:text-lg"
          >
            {agent.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
