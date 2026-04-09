interface ScoreBadgeProps {
  score: number | null;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        —
      </span>
    );
  }

  let bg: string;
  let text: string;
  if (score >= 4) {
    bg = "bg-[var(--success-light)]";
    text = "text-[var(--success)]";
  } else if (score >= 3) {
    bg = "bg-[var(--warning-light)]";
    text = "text-[var(--warning)]";
  } else {
    bg = "bg-[var(--danger-light)]";
    text = "text-[var(--danger)]";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}
    >
      {score}/5
    </span>
  );
}
