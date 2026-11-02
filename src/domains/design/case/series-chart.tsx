import type { SeriesPoints } from "./types";

type Point = [string, number];

type Props = { series: SeriesPoints; colorIndex: number };

const width = 640;
const height = 160;
const margin = { left: 8, right: 8, top: 8, bottom: 18 };
const colors = ["var(--heat)", "var(--cold)", "var(--power)", "var(--hot)", "var(--gas)"];

function fromRows(rows: (string | number)[][]): Point[] {
  return rows.flatMap((row) => {
    const [time, value] = row;
    if (typeof time !== "string" || typeof value !== "number") return [];
    const point: Point = [time, value];
    return [point];
  });
}

function toExtent(values: number[]): { low: number; high: number } {
  return { low: Math.min(...values), high: Math.max(...values) };
}

function toPath(points: Point[], low: number, high: number): string {
  const span = high - low === 0 ? 1 : high - low;
  const last = Math.max(points.length - 1, 1);
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  return points
    .map(([, value], index) => {
      const x = margin.left + (index / last) * plotWidth;
      const y = margin.top + (1 - (value - low) / span) * plotHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function dateOf(point: Point | undefined): string {
  return point === undefined ? "" : point[0].slice(0, 10);
}

/** A line chart of one series in the unit gemini reads it in, with its range and period as text. */
export function SeriesChart({ series, colorIndex }: Props) {
  const { name, unit } = series;
  const points = fromRows(series.points);
  if (points.length === 0) return <p className="text-muted">{name} has no points.</p>;
  const { low, high } = toExtent(points.map(([, value]) => value));
  const summary = `${name}: ${String(points.length)} points from ${dateOf(points[0])} to ${dateOf(points.at(-1))}, from ${String(low)} to ${String(high)} ${unit}`;
  return (
    <figure className="m-0 flex flex-col gap-1">
      <figcaption className="text-[12.5px]">
        <span className="font-medium">{name}</span>{" "}
        <span className="text-muted tabular-nums">
          {String(low)} to {String(high)} {unit}, {dateOf(points[0])} to {dateOf(points.at(-1))}
        </span>
      </figcaption>
      <svg
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className="h-auto w-full rounded-control bg-sunken"
      >
        <path
          d={toPath(points, low, high)}
          fill="none"
          stroke={colors[colorIndex % colors.length]}
          strokeWidth="1.5"
        />
      </svg>
    </figure>
  );
}
