interface RatingBreakdownProps {
  breakdown: Record<number, number>;
  total: number;
}

export function RatingBreakdown({ breakdown, total }: RatingBreakdownProps) {
  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-1.5">
      {stars.map((star) => {
        const count = breakdown[star] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[var(--color-text-secondary,#999)] w-4 text-right">
              {star}
            </span>
            <div className="flex-1 h-2 bg-[var(--color-bg-subtle,#111)] border border-[var(--color-border-default,#333)]">
              <div
                className="h-full bg-[var(--aiox-lime,#D1FF00)] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[var(--color-text-muted,#666)] w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
