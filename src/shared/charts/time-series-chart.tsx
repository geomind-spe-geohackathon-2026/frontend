import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { toNiceTicks } from "./scale";
import { toEnergy, toTimeTicks } from "./time-ticks";

export type TimePoint = { time: string; value: number };

type Props = { title: string; subtitle?: string; unit: string; points: TimePoint[] };

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

function isRow(value: unknown): value is Row {
  return (
    typeof value === "object" && value !== null && "time" in value && typeof value.time === "number"
  );
}

const config = { value: { label: "Value", color: "var(--accent)" } } satisfies ChartConfig;

function Plot({ rows, unit, title }: { rows: Row[]; unit: string; title: string }) {
  const first = rows[0]?.time ?? 0;
  const last = rows.at(-1)?.time ?? 0;
  const values = rows.map((row) => row.value);
  const ticks = toNiceTicks(Math.min(...values), Math.max(...values), 4);
  const timeTicks = toTimeTicks(first, last);
  const labels = new Map(timeTicks.map((tick) => [tick.time, tick.label]));
  return (
    <ChartContainer
      config={config}
      role="img"
      aria-label={`${title} in ${unit}, ${String(rows.length)} points`}
      className="aspect-auto h-[220px] w-full"
    >
      <LineChart data={rows} margin={{ left: 4, right: 12, top: 28, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={[first, last]}
          ticks={timeTicks.map((tick) => tick.time)}
          tickFormatter={(time: number) => labels.get(time) ?? ""}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[ticks[0] ?? "auto", ticks.at(-1) ?? "auto"]}
          ticks={ticks}
          tickFormatter={(value: number) => number.format(value)}
          tickLine={false}
          axisLine={false}
          width={48}
          label={{ value: unit, position: "insideTopLeft", dy: -26, dx: 8 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => {
                const row: unknown = payload[0]?.payload;
                return isRow(row) ? dayFormat.format(row.time) : "";
              }}
              formatter={(value) => `${number.format(Number(value))} ${unit}`}
            />
          }
        />
        <Line
          dataKey="value"
          type="linear"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

/** One series over time (shadcn Chart on Recharts) with date and value axes, a tooltip with the value, and its summary. */
export function TimeSeriesChart({ title, subtitle, unit, points }: Props) {
  const rows = toRows(points);
  const first = rows[0];
  const last = rows.at(-1);
  if (first === undefined || last === undefined) {
    return <p className="text-muted">{title} has no points.</p>;
  }
  return (
    <figure className="m-0 flex w-full flex-col gap-1.5">
      <figcaption>
        <span className="text-[13px] font-medium">{title}</span>
        {subtitle === undefined ? null : (
          <span className="ml-2 font-mono text-[11.5px] text-muted">{subtitle}</span>
        )}
      </figcaption>
      <Plot rows={rows} unit={unit} title={title} />
      <Chips rows={rows} unit={unit} />
    </figure>
  );
}
