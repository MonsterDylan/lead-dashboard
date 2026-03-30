interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "yellow" | "red" | "gray";
}

const colorMap = {
  blue: "bg-[var(--accent-light)] text-[var(--accent)]",
  green: "bg-[var(--success-light)] text-[var(--success)]",
  yellow: "bg-[var(--warning-light)] text-[var(--warning)]",
  red: "bg-[var(--danger-light)] text-[var(--danger)]",
  gray: "bg-gray-100 text-gray-600",
};

export default function StatCard({
  label,
  value,
  sub,
  color = "blue",
}: StatCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
      <p className="text-sm text-[var(--muted)] mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span
          className={`text-3xl font-bold ${colorMap[color].split(" ")[1]}`}
        >
          {value}
        </span>
        {sub && (
          <span className="text-xs text-[var(--muted)] pb-1">{sub}</span>
        )}
      </div>
    </div>
  );
}
