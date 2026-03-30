import { NextResponse } from "next/server";
import { TOKEN_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
