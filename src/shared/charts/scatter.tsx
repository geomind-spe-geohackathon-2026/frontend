import {
  CartesianGrid,
  ErrorBar,
  LabelList,
  Scatter as Points,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { toNiceTicks, toPaddedDomain } from "./scale";

export type ScatterPoint = {
  id: string;
  label: string;
  mark?: string | undefined;
  x: number;
  y: number;
  xRange?: [number, number] | undefined;
  yRange?: [number, number] | undefined;
};

type Props = {
  points: ScatterPoint[];
  paretoIds: string[];
  xTitle: string;
  yTitle: string;
  title: string;
};

type Row = ScatterPoint & { xError: [number, number]; yError: [number, number] };

const config = {
  design: { label: "Design", color: "var(--accent)" },
  front: { label: "Trade-off line", color: "var(--muted)" },
} satisfies ChartConfig;

const number = new Intl.NumberFormat("en", { maximumFractionDigits: 3 });

function toTicks(values: number[]): number[] {
  const [low, high] = toPaddedDomain(Math.min(...values), Math.max(...values), 0.1);
  return toNiceTicks(low, high, 5);
}

function toDomain(ticks: number[]): [number, number] {
  return [ticks[0] ?? 0, ticks.at(-1) ?? 1];
}

function toSummary(points: ScatterPoint[], paretoIds: string[]): string {
  const pareto = points.filter((point) => paretoIds.includes(point.id)).map((point) => point.label);
  return `${String(points.length)} designs, on the trade-off line: ${pareto.join(", ") || "none"}`;
}

function toError(value: number, range: [number, number] | undefined): [number, number] {
  return range === undefined ? [0, 0] : [value - range[0], range[1] - value];
}

function toRows(points: ScatterPoint[]): Row[] {
  return points.map((point) => ({
    ...point,
    xError: toError(point.x, point.xRange),
    yError: toError(point.y, point.yRange),
  }));
}

/** A scatter of two quantities (shadcn Chart on Recharts) with spread bars and a dashed line through the trade-offs (Pareto set). */
export function Scatter({ points, paretoIds, xTitle, yTitle, title }: Props) {
  if (points.length === 0) return null;
  const rows = toRows(points);
  const front = rows.filter((row) => paretoIds.includes(row.id)).sort((a, b) => a.x - b.x);
  const xTicks = toTicks(points.flatMap((point) => [point.x, ...(point.xRange ?? [])]));
  const yTicks = toTicks(points.flatMap((point) => [point.y, ...(point.yRange ?? [])]));
  return (
    <ChartContainer
      config={config}
      role="img"
      aria-label={`${title}: ${toSummary(points, paretoIds)}`}
      className="aspect-auto h-[360px] w-full"
    >
      <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 24 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="x"
          domain={toDomain(xTicks)}
          ticks={xTicks}
          tickFormatter={(value: number) => number.format(value)}
          tickLine={false}
          label={{ value: xTitle, position: "insideBottom", offset: -16 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={toDomain(yTicks)}
          ticks={yTicks}
          tickFormatter={(value: number) => number.format(value)}
          tickLine={false}
          label={{ value: yTitle, angle: -90, position: "insideLeft" }}
        />
        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideIndicator />} />
        {front.length > 1 ? (
          <Points
            data={front}
            fill="var(--color-front)"
            line={{ stroke: "var(--color-front)", strokeDasharray: "5 4" }}
            shape={() => <g />}
            isAnimationActive={false}
          />
        ) : null}
        <Points data={rows} fill="var(--color-design)" isAnimationActive={false}>
          <ErrorBar dataKey="xError" direction="x" width={4} stroke="var(--muted)" />
          <ErrorBar dataKey="yError" direction="y" width={4} stroke="var(--muted)" />
          <LabelList
            dataKey="mark"
            content={(props) => {
              const x = Number(props.x ?? 0) + Number(props.width ?? 0) + 1;
              const y = Number(props.y ?? 0) - 1;
              return (
                <text x={x} y={y} className="fill-foreground text-[11px] tabular-nums">
                  {String(props.value ?? "")}
                </text>
              );
            }}
          />
        </Points>
      </ScatterChart>
    </ChartContainer>
  );
}
