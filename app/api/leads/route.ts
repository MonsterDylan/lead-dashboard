import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Number(req.nextUrl.searchParams.get("days") ?? "7");
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select(
      "appt_uuid, first_seen_at, published_time, first_name, last_name, full_name, state, age, income, investable_assets, assets_min, credit_cost, app_type, comments, topics, sale, interested_users, status, ai_score, ai_reasoning"
    )
    .gte("first_seen_at", cutoff)
    .order("first_seen_at", { ascending: true });

  if (leadsErr) {
    return NextResponse.json({ error: leadsErr.message }, { status: 500 });
  }

  const { data: drops, error: dropsErr } = await supabase
    .from("lead_drops")
    .select(
      "detected_at, drop_type, new_lead_count, new_lead_ids, prev_total, new_total"
    )
    .gte("detected_at", cutoff)
    .order("detected_at", { ascending: true });

  if (dropsErr) {
    return NextResponse.json({ error: dropsErr.message }, { status: 500 });
  }

  return NextResponse.json({ leads: leads ?? [], drops: drops ?? [] });
}
