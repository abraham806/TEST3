// 3D simplex noise — Ian McEwan, Ashima Arts (MIT).
const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const orbVertexShader = /* glsl */ `
uniform float uTime;
uniform float uDisplace;
uniform float uFrequency;
uniform float uSwirl;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vPos;
varying float vNoise;

${SIMPLEX_NOISE}

// Twists the noise domain around the Y axis: produces the internal vortex.
vec3 swirlDomain(vec3 p) {
  float a = uSwirl * (p.y * 2.4 + uTime * 1.6);
  float c = cos(a);
  float s = sin(a);
  return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
}

float field(vec3 p) {
  vec3 q = swirlDomain(p) * uFrequency;
  float n = snoise(q + vec3(0.0, uTime * 0.6, uTime * 0.3));
#ifndef LOW_QUALITY
  n = (n + 0.5 * snoise(q * 2.1 - vec3(uTime * 0.45))) * 0.6667;
#endif
  return n;
}

vec3 displaced(vec3 p) {
  return p * (1.0 + field(p) * uDisplace);
}

void main() {
  vec3 p = normalize(position);
  float n = field(p);
  vec3 pos = p * (1.0 + n * uDisplace);

#ifndef LOW_QUALITY
  // Rebuild the normal from two displaced neighbours so lighting follows the waves.
  vec3 up = abs(p.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(p, up));
  vec3 b = normalize(cross(p, t));
  vec3 pt = displaced(normalize(p + t * 0.01));
  vec3 pb = displaced(normalize(p + b * 0.01));
  vec3 nrm = normalize(cross(pt - pos, pb - pos));
  if (dot(nrm, p) < 0.0) nrm = -nrm;
#else
  vec3 nrm = p;
#endif

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * nrm);
  vViewDir = normalize(cameraPosition - world.xyz);
  vPos = p;
  vNoise = n;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const orbFragmentShader = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uRim;
uniform vec3 uCool;
uniform vec3 uHot;
uniform float uTime;
uniform float uBrightness;
uniform float uTint;
uniform float uSwirl;
uniform float uAudio;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vPos;
varying float vNoise;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDir);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - ndv, 2.4);

  // Rippling colour gradient across the surface.
  float g = 0.5 + 0.5 * sin(vPos.y * 2.2 + vPos.x * 1.4 + uTime * 0.9 + vNoise * 3.0);
  vec3 body = mix(uSecondary, uPrimary, g);
  vec3 tintColor = uTint < 0.0 ? uCool : uHot;
  body = mix(body, tintColor, abs(uTint) * 0.3);

  // Liquid depth: dark core facing the viewer, colour gathering towards the edges.
  vec3 col = mix(uCore, body, 0.12 + 0.6 * smoothstep(-0.7, 0.9, vNoise));
  col *= 0.35 + 0.65 * (1.0 - ndv * 0.85);

  // Luminous veins where the noise field crosses zero: the "energy" inside the liquid.
  float veins = pow(1.0 - min(abs(vNoise) * 1.6, 1.0), 9.0);
  col += mix(body, uRim, 0.5) * veins * 0.55;

  // Internal vortex bands (thinking).
  float ang = atan(vPos.z, vPos.x);
  float bands = sin(ang * 3.0 + vPos.y * 7.0 - uTime * 3.5 + vNoise * 2.5);
  col += body * smoothstep(0.55, 1.0, bands) * uSwirl * 0.9;

  // Fresnel rim + audio flash on the very edge.
  col += uRim * fresnel * 1.35;
  col += uHot * pow(fresnel, 5.0) * uAudio * 1.2;

  // Soft specular highlight to sell the liquid surface.
  vec3 L = normalize(vec3(-0.45, 0.7, 0.6));
  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 48.0);
  col += uHot * spec * 0.35;

  gl_FragColor = vec4(col * uBrightness, 1.0);
}
`;

export const haloVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Billboard glow behind the orb. The plane is HALO_SIZE wide, orb radius ~1.
export const haloFragmentShader = /* glsl */ `
uniform vec3 uGlow;
uniform float uIntensity;
uniform float uSwirl;
uniform float uTime;
uniform float uOrbRadius;

varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float d = length(p);
  float r = uOrbRadius;

  float glow = exp(-max(d - r * 0.92, 0.0) * 5.5) * smoothstep(1.0, 0.55, d);

  // Thin HUD ring with rotating dashes, only while thinking.
  float ang = atan(p.y, p.x);
  float ring = exp(-abs(d - r * 1.32) * 140.0);
  float dashes = smoothstep(0.2, 0.9, sin(ang * 18.0 + uTime * 2.5));
  float ring2 = exp(-abs(d - r * 1.48) * 220.0) * smoothstep(-0.2, 0.8, sin(ang * 3.0 - uTime * 1.6));
  float hud = (ring * dashes + ring2 * 0.7) * uSwirl;

  vec3 col = uGlow * (glow * uIntensity + hud * 1.4);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const starsVertexShader = /* glsl */ `
attribute float aSize;
attribute float aPhase;
uniform float uTime;
uniform float uPixelRatio;
varying float vTwinkle;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase * 0.8) + aPhase * 6.2831);
  gl_PointSize = aSize * uPixelRatio * (12.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const starsFragmentShader = /* glsl */ `
uniform vec3 uColor;
varying float vTwinkle;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor * a * a * vTwinkle, 1.0);
}
`;
