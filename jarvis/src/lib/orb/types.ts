/**
 * Visual states of the orb. They map 1:1 to the conversation lifecycle:
 * - idle:      connected (or not) but nobody is talking
 * - listening: the user is speaking (driven by input volume)
 * - thinking:  the agent is running a tool / searching
 * - speaking:  the agent is answering (driven by output volume)
 */
export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Anything that can report live audio levels in [0, 1].
 * The ElevenLabs `useConversation` hook exposes exactly this shape
 * (`getInputVolume` / `getOutputVolume`), so the simulator used in the lab
 * and the real SDK are interchangeable.
 */
export interface VolumeSource {
  getInputVolume: () => number;
  getOutputVolume: () => number;
}

/** A colour palette for the orb. Kept separate so themes can be added later. */
export interface OrbTheme {
  id: string;
  label: string;
  /** Deep colour of the orb body. */
  core: string;
  /** Main identity colour (gradient body). */
  primary: string;
  /** Secondary colour mixed in the animated gradient. */
  secondary: string;
  /** Rim / fresnel colour. */
  rim: string;
  /** Colder tint used while listening. */
  cool: string;
  /** Hot, near-white tint used while speaking. */
  hot: string;
  /** Background glow colour. */
  glow: string;
}

/** Numeric parameters the shader is driven by, per visual state. */
export interface OrbParams {
  /** Base surface displacement amplitude. */
  displace: number;
  /** Extra displacement multiplied by the relevant audio level. */
  displaceAudio: number;
  /** Noise frequency (higher = smaller ripples). */
  frequency: number;
  /** Animation speed multiplier. */
  speed: number;
  /** Internal vortex amount (0 = none). */
  swirl: number;
  /** Overall brightness. */
  brightness: number;
  /** Extra brightness multiplied by the audio level. */
  brightnessAudio: number;
  /** Halo intensity. */
  halo: number;
  /** Extra halo multiplied by the audio level. */
  haloAudio: number;
  /** Scale pulse multiplied by the audio level. */
  pulseAudio: number;
  /** Slow breathing amplitude. */
  breath: number;
  /** Tint blend: -1 = cool, 0 = neutral, 1 = hot. */
  tint: number;
  /** Which audio level drives the state: 0 = input (user), 1 = output (agent). */
  audioSource: number;
}
