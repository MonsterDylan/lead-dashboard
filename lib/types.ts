export interface Lead {
  appt_uuid: string;
  first_seen_at: string;
  published_time: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  state: string | null;
  age: number | null;
  age_range: string | null;
  income: string | null;
  investable_assets: string | null;
  assets_min: number | null;
  credit_cost: number | null;
  app_type: string | null;
  comments: string | null;
  topics: string[] | null;
  sale: number | null;
  interested_users: unknown;
  status: string | null;
  ai_score: number | null;
  ai_reasoning: string | null;
  client_notes: string | null;
}

/** Full lead row for the detail modal (includes raw API payload and outreach enrichment). */
export interface LeadOutreachSnapshot {
  id: number;
  linkedin_url: string | null;
  email: string | null;
  email_confidence: string | null;
  apify_profile_data: Record<string, unknown> | null;
}

export interface LeadDetail extends Lead {
  raw_json: Record<string, unknown> | null;
  outreach: LeadOutreachSnapshot | null;
}

export interface Drop {
  detected_at: string;
  drop_type: string;
  new_lead_count: number;
  new_lead_ids: string[];
  prev_total: number | null;
  new_total: number | null;
}

export interface OutreachLead {
  id: number;
  appt_uuid: string | null;
  first_name: string | null;
  last_name: string | null;
  state: string | null;
  age: number | null;
  topics: string[] | null;
  comments: string | null;
  linkedin_url: string | null;
  email: string | null;
  email_confidence: string | null;
  apify_profile_data: Record<string, unknown> | null;
  outreach_enabled: boolean;

  email1_subject: string | null;
  email1_body: string | null;
  email1_generated_at: string | null;
  email1_sent_at: string | null;
  email1_webhook_status: string | null;

  email2_subject: string | null;
  email2_body: string | null;
  email2_generated_at: string | null;
  email2_scheduled_for: string | null;
  email2_sent_at: string | null;
  email2_webhook_status: string | null;

  email3_subject: string | null;
  email3_body: string | null;
  email3_generated_at: string | null;
  email3_scheduled_for: string | null;
  email3_sent_at: string | null;
  email3_webhook_status: string | null;

  source: string;
  created_at: string;
  updated_at: string;
}
