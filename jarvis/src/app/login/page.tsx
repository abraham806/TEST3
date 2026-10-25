import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "JARVIS — Accès" };

export default function LoginPage() {
  return (
    <main className="relative flex h-dvh items-center justify-center overflow-hidden bg-[#01040a] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,200,255,0.35) 0%, rgba(20,70,255,0.12) 40%, transparent 70%)",
        }}
      />
      <LoginForm />
    </main>
  );
}
