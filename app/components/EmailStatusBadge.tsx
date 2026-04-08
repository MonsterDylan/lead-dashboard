interface Props {
  status: string | null;
  sentAt: string | null;
  scheduledFor: string | null;
  generatedAt: string | null;
}

function fmtShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EmailStatusBadge({
  status,
  sentAt,
  scheduledFor,
  generatedAt,
}: Props) {
  if (status === "sent" && sentAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
        Sent {fmtShort(sentAt)}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
        Failed
      </span>
    );
  }

  if (scheduledFor) {
    const scheduled = new Date(scheduledFor);
    const now = new Date();
    if (scheduled > now) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
          Scheduled {fmtShort(scheduledFor)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
        Due
      </span>
    );
  }

  if (generatedAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
        Generated
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
      Pending
    </span>
  );
}
