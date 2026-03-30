import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, TOKEN_NAME, VALID_HASH } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_NAME, VALID_HASH, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}
