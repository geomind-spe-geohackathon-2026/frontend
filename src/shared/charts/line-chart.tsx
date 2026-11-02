import { toLinearScale, toNiceTicks, toPaddedDomain } from "./scale";

export type LineSeries = { name: string; unit: string; points: [string | number, number][] };

type Props = { series: LineSeries[]; title: string };

const width = 720;
const height = 260;
const margin = { top: 12, right: 16, bottom: 28, left: 56 };
const colors = ["var(--heat)", "var(--cold)", "var(--power)", "var(--gas)"];

function toTime(value: string | number): number {
  return typeof value === "number" ? value : Date.parse(value);
}

function toDateLabel(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

type Grid = { valueMin: number; valueMax: number; toY: (value: number) => number };

function ValueGrid({ grid }: { grid: Grid }) {
  const { valueMin, valueMax, toY } = grid;
  return (
    <>
      {toNiceTicks(valueMin, valueMax, 4)
        .filter((tick) => tick >= valueMin && tick <= valueMax)
        .map((tick) => (
          <g key={tick}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={toY(tick)}
              y2={toY(tick)}
              stroke="var(--border)"
            />
            <text
              x={margin.left - 6}
              y={toY(tick) + 4}
              textAnchor="end"
              className="fill-muted text-[11px]"
            >
              {tick}
            </text>
          </g>
        ))}
    </>
  );
}

function Legend({ series }: { series: LineSeries[] }) {
  return (
    <figcaption className="mt-1 flex flex-wrap gap-x-4 text-[12.5px] text-muted">
      {series.map((entry, index) => (
        <span key={entry.name} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-0.5 w-4"
            style={{ background: colors[index % colors.length] }}
          />
          {entry.name} ({entry.unit})
        </span>
      ))}
    </figcaption>
  );
}

/** A line chart of one or more series; each series is listed in a legend with its unit. */
export function LineChart({ series, title }: Props) {
  const all = series.flatMap((entry) => entry.points);
  if (all.length === 0) return null;
  const times = all.map(([time]) => toTime(time));
  const values = all.map(([, value]) => value);
  const [valueMin, valueMax] = toPaddedDomain(Math.min(...values), Math.max(...values), 0.05);
  const timeMin = Math.min(...times);
  const timeMax = Math.max(...times);
  const toX = toLinearScale([timeMin, timeMax], [margin.left, width - margin.right]);
  const toY = toLinearScale([valueMin, valueMax], [height - margin.bottom, margin.top]);
  const legend = series.map((entry) => `${entry.name} (${entry.unit})`).join(", ");
  return (
    <figure className="m-0">
      <svg
        role="img"
        aria-label={`${title}: ${legend}`}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className="w-full"
      >
        <title>{title}</title>
        <ValueGrid grid={{ valueMin, valueMax, toY }} />
        <text x={margin.left} y={height - 8} className="fill-muted text-[11px]">
          {toDateLabel(timeMin)}
        </text>
        <text
          x={width - margin.right}
          y={height - 8}
          textAnchor="end"
          className="fill-muted text-[11px]"
        >
          {toDateLabel(timeMax)}
        </text>
        {series.map((entry, index) => (
          <polyline
            key={entry.name}
            fill="none"
            stroke={colors[index % colors.length]}
            strokeWidth={1.5}
            points={entry.points
              .map(([time, value]) => `${String(toX(toTime(time)))},${String(toY(value))}`)
              .join(" ")}
          />
        ))}
      </svg>
      <Legend series={series} />
    </figure>
  );
}
