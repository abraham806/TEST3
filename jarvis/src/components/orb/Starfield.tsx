"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { starsFragmentShader, starsVertexShader } from "./shaders";

/** Small seeded PRNG so the star layout is pure and stable across renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface StarfieldProps {
  count: number;
  color: string;
  reducedMotion: boolean;
}

export function Starfield({ count, color, reducedMotion }: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const random = mulberry32(1337);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // A deep slab of space behind the orb, never between it and the camera.
      const z = -6 - random() * 30;
      const spread = 6 + -z * 0.9;
      positions[i * 3] = (random() * 2 - 1) * spread;
      positions[i * 3 + 1] = (random() * 2 - 1) * spread;
      positions[i * 3 + 2] = z;
      sizes[i] = 0.6 + Math.pow(random(), 3) * 2.4;
      phases[i] = random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color(color) },
    }),
    [color],
  );

  useFrame((_, dt) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    u.uPixelRatio.value = dpr;
    if (reducedMotion) return;
    u.uTime.value += dt;
    if (pointsRef.current) pointsRef.current.rotation.y += dt * 0.004;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={starsVertexShader}
        fragmentShader={starsFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
