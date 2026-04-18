import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { LeadDetail, LeadOutreachSnapshot } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appt_uuid: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appt_uuid } = await params;

  const { data: row, error: leadErr } = await supabase
    .from("leads")
    .select(
      "appt_uuid, first_seen_at, published_time, first_name, last_name, full_name, state, age, age_range, income, investable_assets, assets_min, credit_cost, app_type, comments, topics, sale, interested_users, status, ai_score, ai_reasoning, client_notes, raw_json"
    )
    .eq("appt_uuid", appt_uuid)
    .maybeSingle();

  if (leadErr) {
    return NextResponse.json({ error: leadErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: outreachRows, error: outErr } = await supabase
    .from("outreach_leads")
    .select("id, linkedin_url, email, email_confidence, apify_profile_data")
    .eq("appt_uuid", appt_uuid)
    .order("created_at", { ascending: false })
    .limit(1);

  if (outErr) {
    return NextResponse.json({ error: outErr.message }, { status: 500 });
  }

  const outreach = (outreachRows?.[0] as LeadOutreachSnapshot | undefined) ?? null;

  const lead: LeadDetail = {
    ...row,
    raw_json: (row.raw_json as Record<string, unknown> | null) ?? null,
    outreach,
  };

  return NextResponse.json({ lead });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appt_uuid: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appt_uuid } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const notes =
    typeof body === "object" &&
    body !== null &&
    "client_notes" in body &&
    typeof (body as { client_notes: unknown }).client_notes === "string"
      ? (body as { client_notes: string }).client_notes
      : null;

  if (notes === null) {
    return NextResponse.json(
      { error: "Expected { client_notes: string }" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("leads")
    .update({ client_notes: notes })
    .eq("appt_uuid", appt_uuid);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, client_notes: notes });
}
