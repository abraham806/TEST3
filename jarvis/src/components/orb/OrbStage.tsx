"use client";

import dynamic from "next/dynamic";

/**
 * Client-only entry point for the WebGL scene. The canvas cannot be
 * prerendered, and splitting it keeps three.js out of the initial bundle.
 */
const OrbStage = dynamic(() => import("./OrbCanvas"), {
  ssr: false,
  loading: () => null,
});

export default OrbStage;
