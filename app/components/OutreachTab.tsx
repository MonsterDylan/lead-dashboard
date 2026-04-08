"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { OutreachLead } from "@/lib/types";
import StatCard from "./StatCard";
import EmailStatusBadge from "./EmailStatusBadge";
import EmailPreviewModal from "./EmailPreviewModal";

export default function OutreachTab() {
  const router = useRouter();
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLead, setPreviewLead] = useState<OutreachLead | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/outreach");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const json = await res.json();
    setLeads(json.leads ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleEnabled(lead: OutreachLead) {
    setTogglingIds((prev) => new Set(prev).add(lead.id));
    try {
      const res = await fetch(`/api/outreach/${lead.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreach_enabled: !lead.outreach_enabled }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? { ...l, outreach_enabled: !l.outreach_enabled }
              : l
          )
        );
      }
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  }

  const withEmail = leads.filter((l) => l.email);
  const totalEmailsSent = leads.reduce((sum, l) => {
    let count = 0;
    if (l.email1_webhook_status === "sent") count++;
    if (l.email2_webhook_status === "sent") count++;
    if (l.email3_webhook_status === "sent") count++;
    return sum + count;
  }, 0);
  const sequenceComplete = leads.filter(
    (l) =>
      l.email1_webhook_status === "sent" &&
      l.email2_webhook_status === "sent" &&
      l.email3_webhook_status === "sent"
  );

  function byName(a: OutreachLead, b: OutreachLead) {
    const nameA = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim().toLowerCase();
    const nameB = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  }

  const emailedLeads = leads
    .filter((l) => l.email1_webhook_status === "sent" || l.email2_webhook_status === "sent" || l.email3_webhook_status === "sent")
    .sort(byName);

  const pendingLeads = leads
    .filter((l) => l.email1_webhook_status !== "sent" && l.email2_webhook_status !== "sent" && l.email3_webhook_status !== "sent")
    .sort(byName);

  if (loading) {
    return (
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
          Loading outreach data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Outreach Leads" value={leads.length} color="blue" />
        <StatCard label="Emails Found" value={withEmail.length} color="green" />
        <StatCard label="Emails Sent" value={totalEmailsSent} color="yellow" />
        <StatCard
          label="Sequence Complete"
          value={sequenceComplete.length}
          color="gray"
        />
      </div>

      {[
        { label: "Emailed Leads", items: emailedLeads, accent: "green" },
        { label: "Pending Leads", items: pendingLeads, accent: "muted" },
      ].map((group) => (
        <div
          key={group.label}
          className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">{group.label}</h2>
              <span className="text-sm text-[var(--muted)]">
                {group.items.length}
              </span>
            </div>
            {group.label === "Emailed Leads" && (
              <button
                onClick={fetchData}
                className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors cursor-pointer"
                title="Refresh"
              >
                <svg
                  className="w-4 h-4 text-[var(--muted)]"
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
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-left text-[var(--muted)]">
                  <th className="px-4 py-3 font-medium w-10">On</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Email 1</th>
                  <th className="px-4 py-3 font-medium">Email 2</th>
                  <th className="px-4 py-3 font-medium">Email 3</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {group.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-[var(--muted)]"
                    >
                      {group.label === "Emailed Leads"
                        ? "No emails sent yet"
                        : "No pending leads"}
                    </td>
                  </tr>
                ) : (
                  group.items.map((l) => (
                    <tr
                      key={l.id}
                      className={`hover:bg-[var(--background)] transition-colors ${
                        !l.outreach_enabled ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleEnabled(l)}
                          disabled={togglingIds.has(l.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            l.outreach_enabled ? "bg-[var(--accent)]" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                              l.outreach_enabled
                                ? "translate-x-[18px]"
                                : "translate-x-[3px]"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {l.first_name} {l.last_name}
                        </div>
                        {l.linkedin_url && (
                          <a
                            href={l.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--accent)] hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {l.state || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {l.email ? (
                          <span className="text-xs font-mono">{l.email}</span>
                        ) : (
                          <span className="text-xs text-[var(--muted)] italic">
                            Pending discovery
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {l.email_confidence ? (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              l.email_confidence === "high"
                                ? "bg-green-50 text-green-700"
                                : l.email_confidence === "medium"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {l.email_confidence}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPreviewLead(l)}
                          className="cursor-pointer"
                        >
                          <EmailStatusBadge
                            status={l.email1_webhook_status}
                            sentAt={l.email1_sent_at}
                            scheduledFor={null}
                            generatedAt={l.email1_generated_at}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPreviewLead(l)}
                          className="cursor-pointer"
                        >
                          <EmailStatusBadge
                            status={l.email2_webhook_status}
                            sentAt={l.email2_sent_at}
                            scheduledFor={l.email2_scheduled_for}
                            generatedAt={l.email2_generated_at}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPreviewLead(l)}
                          className="cursor-pointer"
                        >
                          <EmailStatusBadge
                            status={l.email3_webhook_status}
                            sentAt={l.email3_sent_at}
                            scheduledFor={l.email3_scheduled_for}
                            generatedAt={l.email3_generated_at}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            l.source === "csv_import"
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {l.source === "csv_import" ? "CSV" : "Live"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {previewLead && (
        <EmailPreviewModal
          open={!!previewLead}
          onClose={() => setPreviewLead(null)}
          leadName={`${previewLead.first_name ?? ""} ${previewLead.last_name ?? ""}`.trim()}
          email={previewLead.email ?? ""}
          emails={[
            {
              subject: previewLead.email1_subject,
              body: previewLead.email1_body,
              status: previewLead.email1_webhook_status,
              sentAt: previewLead.email1_sent_at,
              scheduledFor: null,
            },
            {
              subject: previewLead.email2_subject,
              body: previewLead.email2_body,
              status: previewLead.email2_webhook_status,
              sentAt: previewLead.email2_sent_at,
              scheduledFor: previewLead.email2_scheduled_for,
            },
            {
              subject: previewLead.email3_subject,
              body: previewLead.email3_body,
              status: previewLead.email3_webhook_status,
              sentAt: previewLead.email3_sent_at,
              scheduledFor: previewLead.email3_scheduled_for,
            },
          ]}
        />
      )}
    </div>
  );
}
