import { NextResponse, type NextRequest } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/server/auth";

const ELEVENLABS_SIGNED_URL = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";

export type SignedUrlError =
  | "unauthorized"
  | "not_configured"
  | "invalid_api_key"
  | "agent_not_found"
  | "quota_exceeded"
  | "upstream_error";

function fail(error: SignedUrlError, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Returns a short-lived signed WebSocket URL for the private ElevenLabs agent.
 * The API key never leaves the server. POST so it is never cached.
 */
export async function POST(request: NextRequest) {
  // Defence in depth: the proxy already checks this.
  if (!(await isValidSession(request.cookies.get(SESSION_COOKIE)?.value))) {
    return fail("unauthorized", 401);
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) return fail("not_configured", 500);

  let res: Response;
  try {
    res = await fetch(`${ELEVENLABS_SIGNED_URL}?agent_id=${encodeURIComponent(agentId)}`, {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
    });
  } catch {
    return fail("upstream_error", 502);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[signed-url] ElevenLabs error", res.status, text.slice(0, 300));
    if (res.status === 401 || res.status === 403) {
      return /quota|credit|limit/i.test(text) ? fail("quota_exceeded", 402) : fail("invalid_api_key", 500);
    }
    if (res.status === 404 || res.status === 422) return fail("agent_not_found", 500);
    if (res.status === 402 || res.status === 429) return fail("quota_exceeded", 402);
    return fail("upstream_error", 502);
  }

  const data = (await res.json()) as { signed_url?: string };
  if (!data.signed_url) return fail("upstream_error", 502);

  return NextResponse.json(
    { signedUrl: data.signed_url },
    { headers: { "Cache-Control": "no-store" } },
  );
}
