"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  defaults: {
    first_name: string;
    last_name: string;
    email: string;
    linkedin_url: string;
  };
}

export default function WealthboxModal({ open, onClose, defaults }: Props) {
  const [form, setForm] = useState(defaults);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/outreach/wealthbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setResult("success");
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.error ?? `Failed (${res.status})`);
        setResult("error");
      }
    } catch {
      setErrorMsg("Network error");
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
          <h2 className="font-semibold text-base">Add to Wealthbox CRM</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--background)] transition-colors cursor-pointer text-[var(--muted)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-[var(--muted)]">First Name *</span>
              <input
                required
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[var(--muted)]">Last Name *</span>
              <input
                required
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-[var(--muted)]">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[var(--muted)]">LinkedIn URL</span>
            <input
              value={form.linkedin_url}
              onChange={(e) => update("linkedin_url", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </label>

          <div className="border-t border-[var(--card-border)] pt-3">
            <p className="text-xs font-medium text-[var(--muted)] mb-2">Auto-set fields</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-[var(--background)] px-3 py-2 text-center">
                <div className="text-[var(--muted)]">Source</div>
                <div className="font-medium mt-0.5">Direct Mail</div>
              </div>
              <div className="rounded-lg bg-[var(--background)] px-3 py-2 text-center">
                <div className="text-[var(--muted)]">Type</div>
                <div className="font-medium mt-0.5">Prospect</div>
              </div>
              <div className="rounded-lg bg-[var(--background)] px-3 py-2 text-center">
                <div className="text-[var(--muted)]">Status</div>
                <div className="font-medium mt-0.5">Active</div>
              </div>
            </div>
          </div>

          {result === "success" && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
              Contact added to Wealthbox
            </div>
          )}

          {result === "error" && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--background)] transition-colors cursor-pointer"
            >
              {result === "success" ? "Close" : "Cancel"}
            </button>
            {result !== "success" && (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Adding..." : "Add to Wealthbox"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
