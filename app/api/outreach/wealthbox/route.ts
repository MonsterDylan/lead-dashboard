import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

const WEALTHBOX_API = "https://api.crmworkspace.com/v1";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.WEALTHBOX_API_KEY;
  if (!apiKey || apiKey === "your_wealthbox_access_token_here") {
    return NextResponse.json(
      { error: "Wealthbox API key not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();

  const payload: Record<string, unknown> = {
    first_name: body.first_name,
    last_name: body.last_name,
    type: "Person",
    contact_source: "Direct Mail",
    contact_type: "Prospect",
    status: "Active",
    linkedin_url: body.linkedin_url || undefined,
    email_addresses: body.email
      ? [{ address: body.email, kind: "Work", principal: true }]
      : [],
  };

  const res = await fetch(`${WEALTHBOX_API}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ACCESS_TOKEN: apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return NextResponse.json(
      { error: `Wealthbox API error: ${res.status}`, details: errBody },
      { status: res.status }
    );
  }

  const contact = await res.json();
  return NextResponse.json({ success: true, contact });
}
