import type { Metadata } from "next";
import OrbLab from "@/components/lab/OrbLab";

export const metadata: Metadata = { title: "JARVIS — Labo orbe" };

// Test bench: the orb alone with simulated volumes.
export default function LabPage() {
  return <OrbLab />;
}
