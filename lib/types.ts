export interface Lead {
  appt_uuid: string;
  first_seen_at: string;
  published_time: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  state: string | null;
  age: number | null;
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
}

export interface Drop {
  detected_at: string;
  drop_type: string;
  new_lead_count: number;
  new_lead_ids: string[];
  prev_total: number | null;
  new_total: number | null;
}
