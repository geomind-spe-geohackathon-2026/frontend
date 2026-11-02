type Props = { values: number[]; label: string };

const width = 480;
const height = 72;

function toLine(values: number[]): string {
  const low = Math.min(...values);
  const span = Math.max(...values) - low || 1;
  const last = Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = (index / last) * width;
      const y = height - ((value - low) / span) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** A small line of a series, without axes; the figures go beside it as text. */
export function Sparkline({ values, label }: Props) {
  if (values.length === 0) return null;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      preserveAspectRatio="none"
      className="h-[72px] w-full"
    >
      <polyline
        points={toLine(values)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
