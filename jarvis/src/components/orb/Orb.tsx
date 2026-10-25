"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ORB_PRESETS } from "@/lib/orb/presets";
import type { OrbParams, OrbState, OrbTheme, VolumeSource } from "@/lib/orb/types";
import {
  haloFragmentShader,
  haloVertexShader,
  orbFragmentShader,
  orbVertexShader,
} from "./shaders";

const HALO_SIZE = 6;

// Audio smoothing: fast attack, slower release, so peaks feel snappy but decay gracefully.
const AUDIO_ATTACK = 22;
const AUDIO_RELEASE = 7;
// How fast the orb morphs from one visual state to another.
const STATE_LAMBDA = 3.2;

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function clamp01(v: number) {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}

export interface OrbProps {
  state: OrbState;
  volumes: VolumeSource;
  theme: OrbTheme;
  quality: "low" | "high";
  reducedMotion: boolean;
  onActivate?: () => void;
}

export function Orb({ state, volumes, theme, quality, reducedMotion, onActivate }: OrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  // Uniforms are mutated every frame through the material refs, never through render values.
  const orbMatRef = useRef<THREE.ShaderMaterial>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null);

  // Keep the latest props in refs so the render loop never triggers React renders.
  const volumesRef = useRef(volumes);
  const stateRef = useRef(state);
  const reducedRef = useRef(reducedMotion);
  useEffect(() => {
    volumesRef.current = volumes;
    stateRef.current = state;
    reducedRef.current = reducedMotion;
  });

  const live = useRef({
    params: { ...ORB_PRESETS.idle } as OrbParams,
    input: 0,
    output: 0,
    phase: 0,
    clock: 0,
  });

  const orbUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDisplace: { value: 0 },
      uFrequency: { value: 1 },
      uSwirl: { value: 0 },
      uBrightness: { value: 0.5 },
      uTint: { value: 0 },
      uAudio: { value: 0 },
      uCore: { value: new THREE.Color() },
      uPrimary: { value: new THREE.Color() },
      uSecondary: { value: new THREE.Color() },
      uRim: { value: new THREE.Color() },
      uCool: { value: new THREE.Color() },
      uHot: { value: new THREE.Color() },
    }),
    [],
  );

  const haloUniforms = useMemo(
    () => ({
      uGlow: { value: new THREE.Color() },
      uIntensity: { value: 0.3 },
      uSwirl: { value: 0 },
      uTime: { value: 0 },
      uOrbRadius: { value: 2 / HALO_SIZE },
    }),
    [],
  );

  const detail = quality === "low" ? 20 : 56;
  const defines = useMemo(() => (quality === "low" ? { LOW_QUALITY: "" } : {}), [quality]);

  useFrame((_, rawDt) => {
    // Clamp dt so a backgrounded tab doesn't cause a jump when it comes back.
    const dt = Math.min(rawDt, 0.1);
    const l = live.current;
    const reduced = reducedRef.current;

    const inTarget = clamp01(volumesRef.current.getInputVolume());
    const outTarget = clamp01(volumesRef.current.getOutputVolume());
    l.input = damp(l.input, inTarget, inTarget > l.input ? AUDIO_ATTACK : AUDIO_RELEASE, dt);
    l.output = damp(l.output, outTarget, outTarget > l.output ? AUDIO_ATTACK : AUDIO_RELEASE, dt);

    const target = ORB_PRESETS[stateRef.current];
    const p = l.params;
    for (const key of Object.keys(target) as (keyof OrbParams)[]) {
      p[key] = damp(p[key], target[key], STATE_LAMBDA, dt);
    }

    const audio = l.input * (1 - p.audioSource) + l.output * p.audioSource;
    const motion = reduced ? 0.3 : 1;

    // Phase advances with speed so speed changes never make the animation jump.
    l.phase += dt * p.speed * motion * (1 + audio * 0.8);
    l.clock += dt;

    const u = orbMatRef.current?.uniforms;
    const h = haloMatRef.current?.uniforms;
    if (!u || !h) return;
    u.uTime.value = l.phase;
    u.uDisplace.value = p.displace + p.displaceAudio * audio * (reduced ? 0.4 : 1);
    u.uFrequency.value = p.frequency;
    u.uSwirl.value = p.swirl;
    u.uBrightness.value = p.brightness + p.brightnessAudio * audio;
    u.uTint.value = p.tint;
    u.uAudio.value = audio * p.audioSource;

    h.uIntensity.value = p.halo + p.haloAudio * audio;
    h.uSwirl.value = p.swirl;
    h.uTime.value = l.phase;

    const breath = Math.sin(l.clock * 1.25) * p.breath * motion;
    const pulse = p.pulseAudio * audio * (reduced ? 0.3 : 1);
    groupRef.current?.scale.setScalar(1 + breath + pulse);
    if (meshRef.current && !reduced) meshRef.current.rotation.y += dt * 0.08;
  });

  useEffect(() => {
    const orb = orbMatRef.current?.uniforms;
    const halo = haloMatRef.current?.uniforms;
    if (!orb || !halo) return;
    orb.uCore.value.set(theme.core);
    orb.uPrimary.value.set(theme.primary);
    orb.uSecondary.value.set(theme.secondary);
    orb.uRim.value.set(theme.rim);
    orb.uCool.value.set(theme.cool);
    orb.uHot.value.set(theme.hot);
    halo.uGlow.value.set(theme.glow);
  }, [theme, quality]);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -1.2]} renderOrder={-1}>
        <planeGeometry args={[HALO_SIZE, HALO_SIZE]} />
        <shaderMaterial
          ref={haloMatRef}
          vertexShader={haloVertexShader}
          fragmentShader={haloFragmentShader}
          uniforms={haloUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onActivate?.();
        }}
        onPointerOver={() => {
          if (onActivate) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <icosahedronGeometry args={[1, detail]} />
        <shaderMaterial
          key={quality}
          ref={orbMatRef}
          vertexShader={orbVertexShader}
          fragmentShader={orbFragmentShader}
          uniforms={orbUniforms}
          defines={defines}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
