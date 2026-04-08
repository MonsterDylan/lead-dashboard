"use client";

import { useEffect, useRef } from "react";

interface EmailData {
  subject: string | null;
  body: string | null;
  status: string | null;
  sentAt: string | null;
  scheduledFor: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  leadName: string;
  email: string;
  emails: [EmailData, EmailData, EmailData];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EmailPreviewModal({
  open,
  onClose,
  leadName,
  email,
  emails,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  if (!open) return null;

  const labels = ["Email 1 — Initial Outreach", "Email 2 — Follow-Up", "Email 3 — Final Follow-Up"];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 w-full max-w-3xl rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-0 shadow-2xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Email Sequence — {leadName}
          </h2>
          <p className="text-sm text-[var(--muted)]">{email}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 hover:bg-[var(--background)] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto divide-y divide-[var(--card-border)]">
        {emails.map((e, i) => (
          <div key={i} className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {labels[i]}
              </h3>
              <div className="flex items-center gap-2">
                {e.status === "sent" && e.sentAt && (
                  <span className="text-xs text-green-600 font-medium">
                    Sent {fmtDate(e.sentAt)}
                  </span>
                )}
                {e.status === "failed" && (
                  <span className="text-xs text-red-600 font-medium">Failed</span>
                )}
                {e.status === "pending" && e.scheduledFor && (
                  <span className="text-xs text-blue-600 font-medium">
                    Scheduled {fmtDate(e.scheduledFor)}
                  </span>
                )}
              </div>
            </div>

            {e.subject ? (
              <>
                <div className="mb-2">
                  <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                    Subject
                  </span>
                  <p className="text-sm font-medium text-[var(--foreground)] mt-0.5">
                    {e.subject}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                    Body
                  </span>
                  <div
                    className="mt-1 rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4 text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: e.body ?? "" }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--muted)] italic">
                Not yet generated
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--card-border)] px-6 py-3 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
