import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("outreach_leads")
    .select(
      "id, first_name, last_name, email, email1_subject, email1_body, email1_generated_at, email1_sent_at, email1_webhook_status, email2_subject, email2_body, email2_generated_at, email2_scheduled_for, email2_sent_at, email2_webhook_status, email3_subject, email3_body, email3_generated_at, email3_scheduled_for, email3_sent_at, email3_webhook_status"
    )
    .eq("id", Number(id))
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
