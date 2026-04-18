"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Lead, Drop } from "@/lib/types";
import { normalizeDropLeadIds } from "@/lib/dropIds";
import StatCard from "./components/StatCard";
import ScoreBadge from "./components/ScoreBadge";
import StatusBadge from "./components/StatusBadge";
import OutreachTab from "./components/OutreachTab";
import LeadDetailModal from "./components/LeadDetailModal";

function toPacific(iso: string): Date {
  return new Date(
    new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function fmtDay(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtShortDay(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type Tab = "overview" | "leads" | "drops" | "outreach";

export default function DashboardClient() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [detailApptUuid, setDetailApptUuid] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    const res = await fetch(`/api/leads?days=${days}`);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const json = (await res.json()) as {
      leads?: Lead[];
      drops?: Drop[];
      error?: string;
    };
    if (!res.ok) {
      setApiError(json.error ?? `Request failed (${res.status})`);
      setLeads([]);
      setDrops([]);
      setLoading(false);
      return;
    }
    setLeads(json.leads ?? []);
    setDrops(json.drops ?? []);
    setLoading(false);
  }, [days, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleNotesSaved(apptUuid: string, clientNotes: string) {
    setLeads((prev) =>
      prev.map((l) =>
        l.appt_uuid === apptUuid ? { ...l, client_notes: clientNotes } : l
      )
    );
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const baselineIds = new Set<string>();
  for (const d of drops) {
    if ((d.prev_total ?? 0) === 0) {
      for (const id of normalizeDropLeadIds(d.new_lead_ids)) baselineIds.add(id);
    }
  }
  /** Leads first seen after the initial “full marketplace snapshot” drop (prev_total = 0). */
  const newLeads = leads.filter((l) => !baselineIds.has(l.appt_uuid));
  const genuineDrops = drops.filter((d) => (d.prev_total ?? 0) > 0);

  const scored = leads.filter((l) => l.ai_score !== null);
  const highQuality = scored.filter((l) => (l.ai_score ?? 0) >= 4);
  const preBought = leads.filter(
    (l) =>
      (l.sale !== null && l.sale !== 0) ||
      (l.interested_users !== null && l.interested_users !== undefined)
  );

  const morningCount = genuineDrops
    .filter((d) => d.drop_type === "morning")
    .reduce((s, d) => s + d.new_lead_count, 0);
  const afternoonCount = genuineDrops
    .filter((d) => d.drop_type === "afternoon")
    .reduce((s, d) => s + d.new_lead_count, 0);

  const dayGroups: Record<string, Lead[]> = {};
  for (const l of leads) {
    const pdt = toPacific(l.first_seen_at);
    const key = pdt.toISOString().slice(0, 10);
    (dayGroups[key] ??= []).push(l);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "leads", label: "All Leads" },
    { id: "drops", label: "Drop Log" },
    { id: "outreach", label: "Outreach" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card)] border-b border-[var(--card-border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-semibold">Lead Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last 365 days</option>
              </select>
              <button
                onClick={fetchData}
                className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors cursor-pointer"
                title="Refresh"
              >
                <svg
                  className={`w-4 h-4 text-[var(--muted)] ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                  />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  tab === t.id
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {apiError && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p className="font-medium">Could not load leads from Supabase</p>
            <p className="mt-1 font-mono text-xs break-words">{apiError}</p>
            <p className="mt-2 text-red-700">
              Check Vercel → Project → Settings → Environment Variables for{" "}
              <code className="rounded bg-red-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              and{" "}
              <code className="rounded bg-red-100 px-1">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>
              , then redeploy.
            </p>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
              Loading data...
            </div>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Leads in range"
                    value={leads.length}
                    color="blue"
                  />
                  <StatCard
                    label="High Quality (4+)"
                    value={highQuality.length}
                    color="green"
                  />
                  <StatCard
                    label="Pre-Bought"
                    value={preBought.length}
                    color="yellow"
                  />
                  <StatCard
                    label="Avg / Day"
                    value={
                      Object.keys(dayGroups).length > 0
                        ? (
                            leads.length / Object.keys(dayGroups).length
                          ).toFixed(1)
                        : "0"
                    }
                    color="gray"
                  />
                </div>
                {leads.length > 0 && newLeads.length < leads.length && (
                  <p className="text-xs text-[var(--muted)]">
                    {newLeads.length} of {leads.length} leads count as “new” after the
                    first baseline snapshot drop (where the scraper recorded the full
                    marketplace at once). All {leads.length} appear in the All Leads
                    table.
                  </p>
                )}
                {leads.length === 0 && !loading && !apiError && (
                  <p className="text-xs text-[var(--muted)]">
                    No rows returned for this date range. Try{" "}
                    <strong>Last 365 days</strong>, or confirm in Supabase that{" "}
                    <code className="rounded bg-[var(--background)] px-1 text-[11px]">
                      leads.first_seen_at
                    </code>{" "}
                    falls inside the window. The comment backfill only updates{" "}
                    <code className="rounded bg-[var(--background)] px-1 text-[11px]">
                      comments
                    </code>
                    — it does not remove leads.
                  </p>
                )}

                {/* Window Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
                    <p className="text-sm text-[var(--muted)] mb-1">
                      Morning Window (8:00 AM)
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {morningCount}{" "}
                      <span className="text-sm font-normal text-[var(--muted)]">
                        leads
                      </span>
                    </p>
                  </div>
                  <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
                    <p className="text-sm text-[var(--muted)] mb-1">
                      Afternoon Window (1:00 PM)
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {afternoonCount}{" "}
                      <span className="text-sm font-normal text-[var(--muted)]">
                        leads
                      </span>
                    </p>
                  </div>
                </div>

                {/* Day-by-Day Breakdown */}
                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[var(--card-border)]">
                    <h2 className="font-semibold text-[var(--foreground)]">
                      Day-by-Day Breakdown
                    </h2>
                  </div>
                  <div className="divide-y divide-[var(--card-border)]">
                    {Object.keys(dayGroups).length === 0 ? (
                      <div className="px-5 py-8 text-center text-[var(--muted)]">
                        No new leads detected in this period
                      </div>
                    ) : (
                      Object.keys(dayGroups)
                        .sort()
                        .reverse()
                        .map((dayKey) => {
                          const dayLeads = dayGroups[dayKey];
                          const pdt = toPacific(dayLeads[0].first_seen_at);
                          return (
                            <div key={dayKey} className="px-5 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-[var(--foreground)]">
                                  {fmtDay(pdt)}
                                </h3>
                                <span className="text-sm text-[var(--muted)]">
                                  {dayLeads.length} lead
                                  {dayLeads.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {dayLeads.map((l) => {
                                  const t = toPacific(l.first_seen_at);
                                  return (
                                    <div
                                      key={l.appt_uuid}
                                      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm py-1.5"
                                    >
                                      <span className="text-[var(--muted)] font-mono text-xs whitespace-nowrap">
                                        {fmtTime(t)} PT
                                      </span>
                                      <span className="font-medium">
                                        {l.full_name ?? "Unknown"}
                                      </span>
                                      <span className="text-[var(--muted)]">
                                        {l.state}
                                      </span>
                                      <span className="text-[var(--muted)]">
                                        {l.investable_assets}
                                      </span>
                                      <span className="text-[var(--muted)]">
                                        {l.app_type}
                                      </span>
                                      <ScoreBadge score={l.ai_score} />
                                      <StatusBadge status={l.status} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Drop Timing Pattern */}
                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[var(--card-border)]">
                    <h2 className="font-semibold text-[var(--foreground)]">
                      Drop Timing Pattern
                    </h2>
                    <p className="text-sm text-[var(--muted)] mt-0.5">
                      Exact times when new leads appeared on MoneyPickle
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    {genuineDrops.length === 0 ? (
                      <p className="text-[var(--muted)] text-center py-4">
                        Not enough data yet
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {genuineDrops.map((d, i) => {
                          const pdt = toPacific(d.detected_at);
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-4 text-sm py-1"
                            >
                              <span className="text-[var(--muted)] font-mono text-xs whitespace-nowrap w-28">
                                {fmtShortDay(pdt)}
                              </span>
                              <span className="font-mono text-xs whitespace-nowrap w-28">
                                {fmtTime(pdt)} PT
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  d.drop_type === "morning"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-indigo-50 text-indigo-600"
                                }`}
                              >
                                {d.drop_type}
                              </span>
                              <span className="text-[var(--accent)] font-medium">
                                +{d.new_lead_count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LEADS TAB */}
            {tab === "leads" && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)] flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      All Leads ({leads.length})
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Every lead with{" "}
                      <code className="text-[11px]">first_seen_at</code> in this range.
                      Click a row or &quot;View&quot; for full comments, Catchlight profile,
                      and raw API fields.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--card-border)] text-left text-[var(--muted)]">
                        <th className="px-4 py-3 font-medium">Detected</th>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">State</th>
                        <th className="px-4 py-3 font-medium">Assets</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Credits</th>
                        <th className="px-4 py-3 font-medium">AI Score</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium w-24 text-right">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {leads.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-8 text-center text-[var(--muted)]"
                          >
                            No leads in this period
                          </td>
                        </tr>
                      ) : (
                        [...leads].reverse().map((l) => {
                          const pdt = toPacific(l.first_seen_at);
                          return (
                            <tr
                              key={l.appt_uuid}
                              role="button"
                              tabIndex={0}
                              onClick={() => setDetailApptUuid(l.appt_uuid)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setDetailApptUuid(l.appt_uuid);
                                }
                              }}
                              className="hover:bg-[var(--background)] transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="font-mono text-xs">
                                  {fmtShortDay(pdt)}
                                </div>
                                <div className="font-mono text-xs text-[var(--muted)]">
                                  {fmtTime(pdt)} PT
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {l.full_name ?? "Unknown"}
                                </div>
                                {l.comments && (
                                  <div className="text-xs text-[var(--muted)] mt-0.5 max-w-xs truncate">
                                    {l.comments}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[var(--muted)]">
                                {l.state}
                              </td>
                              <td className="px-4 py-3 text-[var(--muted)]">
                                {l.investable_assets}
                              </td>
                              <td className="px-4 py-3 text-[var(--muted)]">
                                {l.app_type}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {l.credit_cost}
                              </td>
                              <td className="px-4 py-3">
                                <ScoreBadge score={l.ai_score} />
                                {l.ai_reasoning && (
                                  <div
                                    className="text-xs text-[var(--muted)] mt-1 max-w-xs leading-snug"
                                    title={l.ai_reasoning}
                                  >
                                    {l.ai_reasoning.length > 80
                                      ? l.ai_reasoning.slice(0, 77) + "..."
                                      : l.ai_reasoning}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={l.status} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailApptUuid(l.appt_uuid);
                                  }}
                                  className="text-xs font-medium text-[var(--accent)] hover:underline cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DROPS TAB */}
            {tab === "drops" && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)]">
                  <h2 className="font-semibold">
                    Drop Log ({drops.length} events)
                  </h2>
                  <p className="text-sm text-[var(--muted)] mt-0.5">
                    Every time the scraper detected new leads on MoneyPickle
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--card-border)] text-left text-[var(--muted)]">
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Time (PT)</th>
                        <th className="px-4 py-3 font-medium">Window</th>
                        <th className="px-4 py-3 font-medium">New Leads</th>
                        <th className="px-4 py-3 font-medium">
                          Total Before
                        </th>
                        <th className="px-4 py-3 font-medium">Total After</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {drops.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-[var(--muted)]"
                          >
                            No drops recorded in this period
                          </td>
                        </tr>
                      ) : (
                        [...drops].reverse().map((d, i) => {
                          const pdt = toPacific(d.detected_at);
                          const isBaseline = (d.prev_total ?? 0) === 0;
                          return (
                            <tr
                              key={i}
                              className={`hover:bg-[var(--background)] transition-colors ${isBaseline ? "opacity-50" : ""}`}
                            >
                              <td className="px-4 py-3 font-mono text-xs">
                                {fmtShortDay(pdt)}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">
                                {fmtTime(pdt)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    d.drop_type === "morning"
                                      ? "bg-amber-50 text-amber-600"
                                      : "bg-indigo-50 text-indigo-600"
                                  }`}
                                >
                                  {d.drop_type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[var(--accent)] font-medium">
                                +{d.new_lead_count}
                              </td>
                              <td className="px-4 py-3 text-[var(--muted)]">
                                {d.prev_total}
                              </td>
                              <td className="px-4 py-3">{d.new_total}</td>
                              <td className="px-4 py-3 text-xs text-[var(--muted)]">
                                {isBaseline ? "baseline" : "new drop"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* OUTREACH TAB */}
            {tab === "outreach" && <OutreachTab />}
          </>
        )}
      </main>

      <LeadDetailModal
        open={detailApptUuid !== null}
        apptUuid={detailApptUuid}
        onClose={() => setDetailApptUuid(null)}
        onSaved={handleNotesSaved}
      />
    </div>
  );
}
