"use client";

import { useEffect, useState } from "react";
import type { LeadDetail } from "@/lib/types";
import ScoreBadge from "./ScoreBadge";
import StatusBadge from "./StatusBadge";

interface Props {
  open: boolean;
  apptUuid: string | null;
  onClose: () => void;
  onSaved: (apptUuid: string, clientNotes: string) => void;
}

function fmtPacific(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function CatchlightBlock({ raw }: { raw: Record<string, unknown> | null }) {
  const features = raw?.catchlight_features;
  if (!Array.isArray(features) || features.length === 0) return null;

  return (
    <section className="border border-[var(--card-border)] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Marketplace profile (Catchlight)
      </h3>
      <dl className="space-y-2 text-sm">
        {features.map((item, i) => {
          if (!item || typeof item !== "object") return null;
          const f = item as Record<string, unknown>;
          const label = f.label != null ? String(f.label) : `Field ${i + 1}`;
          const value = f.value;
          const text =
            value === null || value === undefined
              ? "—"
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value);
          return (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-0.5">
              <dt className="text-[var(--muted)]">{label}</dt>
              <dd className="text-[var(--foreground)] break-words">{text}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function strTrim(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/** Prefer DB column; fall back to common MoneyPickle keys still present in raw_json. */
function mergedMarketplaceComments(detail: LeadDetail): string | null {
  const direct = strTrim(detail.comments);
  if (direct) return direct;
  const raw = detail.raw_json;
  if (!raw || typeof raw !== "object") return null;
  for (const key of ["rider_notes", "client_comments", "comments", "notes", "message"]) {
    const t = strTrim(raw[key]);
    if (t) return t;
  }
  return null;
}

function normalizeExternalUrl(raw: string): string {
  let u = raw.trim();
  if (!u || u === "null") return "";
  if (!/^https?:\/\//i.test(u)) {
    u = u.replace(/^\/+/, "");
    u = `https://${u}`;
  }
  return u;
}

function looksLikeRealWebUrl(href: string): boolean {
  if (/linkedin\.com|facebook\.com|twitter\.com|^https?:\/\/x\.com\//i.test(href)) {
    return true;
  }
  try {
    return /[a-z]/i.test(new URL(href).hostname);
  } catch {
    return false;
  }
}

function ExtraProfileLinks({ raw }: { raw: Record<string, unknown> | null }) {
  if (!raw) return null;
  const links: { label: string; href: string }[] = [];
  const push = (label: string, val: unknown) => {
    const s = strTrim(val);
    if (!s || s === "0") return;
    const href = normalizeExternalUrl(s);
    if (!href || !looksLikeRealWebUrl(href)) return;
    if (!links.some((x) => x.href === href)) links.push({ label, href });
  };

  push("LinkedIn", raw.linkedin);
  push("Website", raw.website);
  push("Facebook", raw.facebook);
  push("Twitter / X", raw.twitter);

  const features = raw.catchlight_features;
  if (Array.isArray(features)) {
    for (const item of features) {
      if (!item || typeof item !== "object") continue;
      const f = item as Record<string, unknown>;
      const labelRaw = strTrim(f.label);
      const value = strTrim(f.value);
      if (!labelRaw || !value || value === "0") continue;
      const low = labelRaw.toLowerCase();
      if (
        !low.includes("linkedin") &&
        !low.includes("website") &&
        !low.includes("facebook") &&
        !low.includes("twitter") &&
        !low.includes("url")
      ) {
        continue;
      }
      const href = normalizeExternalUrl(value);
      if (!href || !looksLikeRealWebUrl(href)) continue;
      const label =
        labelRaw.length > 36 ? `${labelRaw.slice(0, 33)}…` : labelRaw;
      if (!links.some((x) => x.href === href)) links.push({ label, href });
    }
  }

  if (links.length === 0) return null;

  return (
    <section className="border border-[var(--card-border)] rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
        Profile links (from API / Catchlight)
      </h3>
      <ul className="space-y-2 text-sm list-none p-0 m-0">
        {links.map((x, i) => (
          <li key={`${x.href}-${i}`}>
            <span className="text-[var(--muted)]">{x.label}: </span>
            <a
              href={x.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline break-all"
            >
              {x.href}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RawJsonDetails({ raw }: { raw: Record<string, unknown> | null }) {
  if (!raw || Object.keys(raw).length === 0) return null;
  return (
    <details className="border border-[var(--card-border)] rounded-lg p-4 group">
      <summary className="text-sm font-semibold text-[var(--foreground)] cursor-pointer list-none flex items-center gap-2">
        <span className="text-[var(--muted)] group-open:rotate-90 transition-transform inline-block">
          ▸
        </span>
        Full raw API response (JSON)
      </summary>
      <p className="text-xs text-[var(--muted)] mt-2 mb-2">
        Exact payload stored from MoneyPickle when this lead was detected (includes every field the API returned).
      </p>
      <pre className="text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
        {JSON.stringify(raw, null, 2)}
      </pre>
    </details>
  );
}

export default function LeadDetailModal({
  open,
  apptUuid,
  onClose,
  onSaved,
}: Props) {
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !apptUuid) {
      setDetail(null);
      setNotes("");
      setError(null);
      setSaveMsg(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setSaveMsg(null);
      try {
        const res = await fetch(
          `/api/leads/${encodeURIComponent(apptUuid)}`
        );
        if (res.status === 401) {
          setError("Session expired. Refresh the page and sign in again.");
          return;
        }
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError((j as { error?: string }).error ?? res.statusText);
          return;
        }
        const json = (await res.json()) as { lead: LeadDetail };
        if (cancelled) return;
        setDetail(json.lead);
        setNotes(json.lead.client_notes ?? "");
      } catch {
        if (!cancelled) setError("Failed to load lead.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, apptUuid]);

  async function handleSave() {
    if (!apptUuid) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(apptUuid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_notes: notes }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg((j as { error?: string }).error ?? "Save failed");
        return;
      }
      onSaved(apptUuid, notes);
      setSaveMsg("Saved.");
    } catch {
      setSaveMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const o = detail?.outreach;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detail-title"
        className="w-full max-w-2xl max-h-[min(90vh,860px)] flex flex-col rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex items-start justify-between border-b border-[var(--card-border)] px-5 py-4 gap-3 shrink-0">
        <div className="min-w-0">
          <h2 id="lead-detail-title" className="text-lg font-semibold text-[var(--foreground)] truncate">
            {detail?.full_name ?? "Lead details"}
          </h2>
          {apptUuid && (
            <p className="text-xs text-[var(--muted)] font-mono truncate mt-0.5">
              {apptUuid}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 hover:bg-[var(--background)] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {loading && (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && detail && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <ScoreBadge score={detail.ai_score} />
              <StatusBadge status={detail.status} />
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-[var(--muted)]">Detected (PT)</span>
                <p className="font-medium">{fmtPacific(detail.first_seen_at)}</p>
              </div>
              {detail.published_time && (
                <div>
                  <span className="text-[var(--muted)]">Published</span>
                  <p className="font-medium">{fmtPacific(detail.published_time)}</p>
                </div>
              )}
              <div>
                <span className="text-[var(--muted)]">State</span>
                <p className="font-medium">{detail.state ?? "—"}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Age</span>
                <p className="font-medium">
                  {detail.age != null
                    ? String(detail.age)
                    : detail.age_range ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Income</span>
                <p className="font-medium">{detail.income ?? "—"}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Investable assets</span>
                <p className="font-medium">{detail.investable_assets ?? "—"}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">App type</span>
                <p className="font-medium">{detail.app_type ?? "—"}</p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Credits</span>
                <p className="font-medium">
                  {detail.credit_cost != null ? String(detail.credit_cost) : "—"}
                </p>
              </div>
              {detail.topics && detail.topics.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-[var(--muted)]">Topics</span>
                  <p className="font-medium">{detail.topics.join(", ")}</p>
                </div>
              )}
            </section>

            <section className="border border-[var(--card-border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                Lead comments (from marketplace)
              </h3>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap break-words">
                {mergedMarketplaceComments(detail) ?? "No comments on file."}
              </p>
            </section>

            <ExtraProfileLinks raw={detail.raw_json} />

            {detail.ai_reasoning && (
              <section className="border border-[var(--card-border)] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  AI reasoning
                </h3>
                <p className="text-sm text-[var(--muted)] whitespace-pre-wrap break-words">
                  {detail.ai_reasoning}
                </p>
              </section>
            )}

            {(o?.linkedin_url || o?.email || o?.apify_profile_data) && (
              <section className="border border-[var(--card-border)] rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Outreach / LinkedIn enrichment
                </h3>
                {o.linkedin_url && (
                  <p className="text-sm">
                    <span className="text-[var(--muted)]">LinkedIn </span>
                    <a
                      href={o.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] underline break-all"
                    >
                      {o.linkedin_url}
                    </a>
                  </p>
                )}
                {o.email && (
                  <p className="text-sm">
                    <span className="text-[var(--muted)]">Email </span>
                    <span className="font-medium">{o.email}</span>
                    {o.email_confidence && (
                      <span className="text-[var(--muted)]">
                        {" "}
                        ({o.email_confidence})
                      </span>
                    )}
                  </p>
                )}
                {o.apify_profile_data &&
                  Object.keys(o.apify_profile_data).length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--muted)] mb-1">
                        Apify / scrape payload
                      </p>
                      <pre className="text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(o.apify_profile_data, null, 2)}
                      </pre>
                    </div>
                  )}
              </section>
            )}

            <CatchlightBlock raw={detail.raw_json} />

            <RawJsonDetails raw={detail.raw_json} />

            {(() => {
              const cf = detail.raw_json?.catchlight_features;
              const hasCatchlight =
                Array.isArray(cf) && cf.length > 0;
              const hasOutreach =
                Boolean(o?.linkedin_url || o?.email) ||
                Boolean(
                  o?.apify_profile_data &&
                    Object.keys(o.apify_profile_data).length > 0
                );
              const hasRaw =
                detail.raw_json != null && Object.keys(detail.raw_json).length > 0;
              if (hasCatchlight || hasOutreach || hasRaw) return null;
              return (
                <p className="text-sm text-[var(--muted)]">
                  No extra marketplace profile fields were returned for this lead.
                </p>
              );
            })()}

            <section className="border border-[var(--card-border)] rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Your notes
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Private notes for your team (preferences, follow-ups, feedback for future scoring).
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y min-h-[6rem]"
                placeholder="e.g. Strong fit — prefers tax planning. Low priority until Q3."
              />
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save notes"}
                </button>
                {saveMsg && (
                  <span
                    className={`text-sm ${saveMsg === "Saved." ? "text-green-600" : "text-red-600"}`}
                  >
                    {saveMsg}
                  </span>
                )}
              </div>
            </section>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
