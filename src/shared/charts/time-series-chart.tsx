import { useState, type PointerEvent } from "react";
import { toNiceTicks } from "./scale";
import { toEnergy, toTimeTicks } from "./time-ticks";

export type TimePoint = { time: string; value: number };

type Props = { title: string; subtitle?: string; unit: string; points: TimePoint[] };

const width = 760;
const height = 220;
const margin = { left: 52, right: 12, top: 10, bottom: 24 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;
const dayFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const number = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

type Row = { time: number; value: number };

function toRows(points: TimePoint[]): Row[] {
  return points
    .map((point) => ({ time: Date.parse(point.time), value: point.value }))
    .filter((row) => !Number.isNaN(row.time));
}

function toStats(rows: Row[]) {
  const values = rows.map((row) => row.value);
  const peak = rows.reduce((best, row) => (row.value > best.value ? row : best));
  const step = rows.length > 1 ? (rows[1]?.time ?? 0) - (rows[0]?.time ?? 0) : 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    peak,
    low: Math.min(...values),
    mean: total / values.length,
    sum: (total * step) / 3_600_000,
  };
}

function Chips({ rows, unit }: { rows: Row[]; unit: string }) {
  const { peak, low, mean, sum } = toStats(rows);
  const energy = toEnergy(sum, unit);
  const items = [
    `Peak ${number.format(peak.value)} ${unit}, ${dayFormat.format(peak.time)}`,
    `Lowest ${number.format(low)} ${unit}`,
    `Mean ${number.format(mean)} ${unit}`,
    ...(energy === null ? [] : [`Energy ${energy}`]),
    `${String(rows.length)} points`,
  ];
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 text-[12px] text-muted">
      {items.map((item) => (
        <li key={item} className="rounded-pill border border-border px-2 py-px tabular-nums">
          {item}
        </li>
      ))}
    </ul>
  );
}

type Frame = {
  first: Row;
  last: Row;
  ticks: number[];
  toX: (time: number) => number;
  toY: (value: number) => number;
};

function toFrame(rows: Row[], first: Row, last: Row): Frame {
  const values = rows.map((row) => row.value);
  const ticks = toNiceTicks(Math.min(...values), Math.max(...values), 4);
  const low = ticks[0] ?? 0;
  const high = ticks.at(-1) ?? 1;
  return {
    first,
    last,
    ticks,
    toX: (time) => margin.left + ((time - first.time) / (last.time - first.time || 1)) * plotWidth,
    toY: (value) => margin.top + (1 - (value - low) / (high - low || 1)) * plotHeight,
  };
}

function Axes({ frame, unit }: { frame: Frame; unit: string }) {
  return (
    <>
      {frame.ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={frame.toY(tick)}
            y2={frame.toY(tick)}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text
            x={margin.left - 6}
            y={frame.toY(tick) + 4}
            textAnchor="end"
            fontSize="11"
            fill="var(--muted)"
          >
            {number.format(tick)}
          </text>
        </g>
      ))}
      <text x={margin.left} y={9} fontSize="11" fill="var(--muted)">
        {unit}
      </text>
      {toTimeTicks(frame.first.time, frame.last.time).map((tick) => (
        <text
          key={tick.time}
          x={frame.toX(tick.time)}
          y={height - 6}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted)"
        >
          {tick.label}
        </text>
      ))}
    </>
  );
}

function Crosshair({ frame, row }: { frame: Frame; row: Row }) {
  return (
    <>
      <line
        x1={frame.toX(row.time)}
        x2={frame.toX(row.time)}
        y1={margin.top}
        y2={margin.top + plotHeight}
        stroke="var(--muted)"
        strokeWidth="1"
      />
      <circle
        cx={frame.toX(row.time)}
        cy={frame.toY(row.value)}
        r="4"
        fill="var(--accent)"
        stroke="var(--surface)"
        strokeWidth="2"
      />
    </>
  );
}

function Readout({ row, unit }: { row: Row; unit: string }) {
  return (
    <p
      role="status"
      className="absolute top-1 right-3 m-0 rounded-control border border-border bg-surface px-2 py-0.5 text-[12px] tabular-nums"
    >
      {dayFormat.format(row.time)}: {number.format(row.value)} {unit}
    </p>
  );
}

function toLine(rows: Row[], frame: Frame): string {
  return rows
    .map((row, index) => {
      const place = `${frame.toX(row.time).toFixed(1)} ${frame.toY(row.value).toFixed(1)}`;
      return `${index === 0 ? "M" : "L"}${place}`;
    })
    .join(" ");
}

/** One series over time with date and value axes, a crosshair with the value, and its summary. */
export function TimeSeriesChart({ title, subtitle, unit, points }: Props) {
  const [hover, setHover] = useState<Row | null>(null);
  const rows = toRows(points);
  const first = rows[0];
  const last = rows.at(-1);
  if (first === undefined || last === undefined) {
    return <p className="text-muted">{title} has no points.</p>;
  }
  const frame = toFrame(rows, first, last);

  function handleMove(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.round(((event.clientX - box.left) / box.width) * (rows.length - 1));
    setHover(rows[Math.min(Math.max(index, 0), rows.length - 1)] ?? null);
  }

  return (
    <figure className="m-0 flex w-full flex-col gap-1.5">
      <figcaption>
        <span className="text-[13px] font-medium">{title}</span>
        {subtitle === undefined ? null : (
          <span className="ml-2 font-mono text-[11.5px] text-muted">{subtitle}</span>
        )}
      </figcaption>
      <div className="relative">
        <svg
          role="img"
          aria-label={`${title} in ${unit}, ${String(rows.length)} points`}
          viewBox={`0 0 ${String(width)} ${String(height)}`}
          className="h-auto max-h-[260px] w-full"
        >
          <Axes frame={frame} unit={unit} />
          <path
            d={toLine(rows, frame)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {hover === null ? null : <Crosshair frame={frame} row={hover} />}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerLeave={() => {
              setHover(null);
            }}
          />
        </svg>
        {hover === null ? null : <Readout row={hover} unit={unit} />}
      </div>
      <Chips rows={rows} unit={unit} />
    </figure>
  );
}
