// Stateless session: the cookie holds HMAC-SHA256(ACCESS_PASSWORD, SESSION_SALT).
// Changing ACCESS_PASSWORD invalidates every existing session.
// Uses Web Crypto only, so it runs in the proxy and in route handlers alike.

export const SESSION_COOKIE = "jarvis_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const SESSION_SALT = "jarvis-session-v1";

const encoder = new TextEncoder();

export function getAccessPassword(): string | null {
  const pw = process.env.ACCESS_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

export async function sessionToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(SESSION_SALT));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  const pw = getAccessPassword();
  if (!pw || !cookieValue) return false;
  return safeEqual(cookieValue, await sessionToken(pw));
}
