/**
 * Normalize lead_drops.new_lead_ids from Supabase (JSONB → array, or legacy shapes).
 * Only returns strings that look like UUIDs so we never treat a JSON string as an iterable of chars.
 */
const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeDropLeadIds(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : String(x)))
      .filter((id) => UUID_LIKE.test(id));
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      return normalizeDropLeadIds(JSON.parse(t));
    } catch {
      return [];
    }
  }
  if (typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>).flatMap((v) =>
      normalizeDropLeadIds(v)
    );
  }
  return [];
}
