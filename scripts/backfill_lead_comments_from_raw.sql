-- ==========================================================================
-- One-off: backfill leads.comments from raw_json (MoneyPickle snapshot)
-- ==========================================================================
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Uses the same field order as src/storage.py _comments_from_lead():
--   rider_notes → client_comments → comments → notes → message
--
-- Only updates rows where the coalesced value is non-null (skips leads
-- with no usable text in those keys). Overwrites leads.comments when a
-- value is found so the column matches what a fresh scrape would store.
-- ==========================================================================

BEGIN;

UPDATE public.leads AS l
SET
  comments = v.computed,
  updated_at = now()
FROM (
  SELECT
    appt_uuid,
    COALESCE(
      NULLIF(btrim(raw_json->>'rider_notes'), ''),
      NULLIF(btrim(raw_json->>'client_comments'), ''),
      NULLIF(btrim(raw_json->>'comments'), ''),
      NULLIF(btrim(raw_json->>'notes'), ''),
      NULLIF(btrim(raw_json->>'message'), '')
    ) AS computed
  FROM public.leads
  WHERE raw_json IS NOT NULL
) AS v
WHERE l.appt_uuid = v.appt_uuid
  AND v.computed IS NOT NULL
  AND (l.comments IS DISTINCT FROM v.computed);

COMMIT;

-- Optional: see how many rows still have empty comments after backfill:
-- SELECT count(*) FROM public.leads WHERE comments IS NULL OR btrim(comments) = '';
