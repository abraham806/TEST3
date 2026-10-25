import { NextResponse } from "next/server";
import {
  getAccessPassword,
  safeEqual,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionToken,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  const pw = getAccessPassword();
  if (!pw) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    // Treated as a wrong password below.
  }

  if (!safeEqual(password, pw)) {
    // Slow down brute-force attempts.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await sessionToken(pw), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
