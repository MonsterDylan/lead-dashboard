interface StatusBadgeProps {
  status: string | null;
}

const styles: Record<string, string> = {
  detected: "bg-blue-50 text-blue-600",
  sent_to_n8n: "bg-orange-50 text-orange-600",
  scored: "bg-purple-50 text-purple-600",
  purchased: "bg-[var(--success-light)] text-[var(--success)]",
  skipped: "bg-gray-100 text-gray-500",
  "pre-bought": "bg-[var(--warning-light)] text-[var(--warning)]",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = status ?? "unknown";
  const cls = styles[s] ?? "bg-gray-100 text-gray-500";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}
    >
      {s}
    </span>
  );
}
