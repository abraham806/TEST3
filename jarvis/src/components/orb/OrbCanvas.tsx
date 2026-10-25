"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DEFAULT_THEME } from "@/lib/orb/themes";
import type { OrbState, OrbTheme, VolumeSource } from "@/lib/orb/types";
import { Orb } from "./Orb";
import { Starfield } from "./Starfield";

export interface OrbCanvasProps {
  state: OrbState;
  volumes: VolumeSource;
  theme?: OrbTheme;
  onActivate?: () => void;
  /** Called about once per second with the measured frame rate. */
  onFps?: (fps: number) => void;
}

const FOV = 40;
const BASE_DISTANCE = 7;

/**
 * Pulls the camera back on portrait screens so the orb always fits with room
 * for its halo, and lifts the orb slightly above centre on phones to leave
 * space for subtitles and controls.
 */
function ResponsiveCamera() {
  const get = useThree((s) => s.get);
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    const { camera } = get();
    const z = aspect < 1 ? BASE_DISTANCE / Math.max(aspect, 0.45) ** 0.85 : BASE_DISTANCE;
    const halfHeight = z * Math.tan(((FOV / 2) * Math.PI) / 180);
    camera.position.set(0, aspect < 1 ? -halfHeight * 0.2 : 0, z);
    camera.updateProjectionMatrix();
  }, [get, aspect]);
  return null;
}

function FpsProbe({ onFps }: { onFps: (fps: number) => void }) {
  const accRef = useRef({ frames: 0, time: 0 });
  useFrame((_, dt) => {
    const acc = accRef.current;
    acc.frames++;
    acc.time += dt;
    if (acc.time >= 1) {
      onFps(Math.round(acc.frames / acc.time));
      acc.frames = 0;
      acc.time = 0;
    }
  });
  return null;
}

export default function OrbCanvas({
  state,
  volumes,
  theme = DEFAULT_THEME,
  onActivate,
  onFps,
}: OrbCanvasProps) {
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();
  const low = tier === "low";

  return (
    <Canvas
      dpr={[1, low ? 1.5 : 2]}
      camera={{ position: [0, 0, BASE_DISTANCE], fov: FOV }}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#01040a")}
    >
      <ResponsiveCamera />
      {onFps && <FpsProbe onFps={onFps} />}
      <Starfield count={low ? 450 : 1200} color={theme.rim} reducedMotion={reducedMotion} />
      <Orb
        state={state}
        volumes={volumes}
        theme={theme}
        quality={tier}
        reducedMotion={reducedMotion}
        onActivate={onActivate}
      />
      <EffectComposer multisampling={low ? 0 : 4}>
        <Bloom
          mipmapBlur
          intensity={low ? 0.75 : 0.9}
          luminanceThreshold={0.32}
          luminanceSmoothing={0.3}
          radius={0.75}
          levels={low ? 5 : 7}
        />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
