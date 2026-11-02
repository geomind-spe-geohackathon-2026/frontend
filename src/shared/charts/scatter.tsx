import { toLinearScale, toNiceTicks, toPaddedDomain } from "./scale";

export type ScatterPoint = { id: string; label: string; x: number; y: number };

type Props = {
  points: ScatterPoint[];
  paretoIds: string[];
  xTitle: string;
  yTitle: string;
  title: string;
};

const width = 560;
const height = 320;
const margin = { top: 16, right: 24, bottom: 48, left: 64 };

function toExtent(values: number[]): [number, number] {
  return toPaddedDomain(Math.min(...values), Math.max(...values), 0.1);
}

function toSummary(points: ScatterPoint[], paretoIds: string[]): string {
  const pareto = points.filter((point) => paretoIds.includes(point.id)).map((point) => point.label);
  return `${String(points.length)} designs, best trade-offs: ${pareto.join(", ") || "none"}`;
}

type Layout = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  toX: (value: number) => number;
  toY: (value: number) => number;
};

function toLayout(points: ScatterPoint[]): Layout {
  const [xMin, xMax] = toExtent(points.map((point) => point.x));
  const [yMin, yMax] = toExtent(points.map((point) => point.y));
  return {
    xMin,
    xMax,
    yMin,
    yMax,
    toX: toLinearScale([xMin, xMax], [margin.left, width - margin.right]),
    toY: toLinearScale([yMin, yMax], [height - margin.bottom, margin.top]),
  };
}

function Axes({ layout, xTitle, yTitle }: { layout: Layout; xTitle: string; yTitle: string }) {
  const { xMin, xMax, yMin, yMax, toX, toY } = layout;
  const inside = (min: number, max: number) => (tick: number) => tick >= min && tick <= max;
  return (
    <>
      <rect
        x={margin.left}
        y={margin.top}
        width={width - margin.left - margin.right}
        height={height - margin.top - margin.bottom}
        fill="none"
        stroke="var(--border)"
      />
      {toNiceTicks(xMin, xMax, 5)
        .filter(inside(xMin, xMax))
        .map((tick) => (
          <text
            key={`x${String(tick)}`}
            x={toX(tick)}
            y={height - 30}
            textAnchor="middle"
            className="fill-muted text-[11px]"
          >
            {tick}
          </text>
        ))}
      {toNiceTicks(yMin, yMax, 5)
        .filter(inside(yMin, yMax))
        .map((tick) => (
          <text
            key={`y${String(tick)}`}
            x={margin.left - 8}
            y={toY(tick) + 4}
            textAnchor="end"
            className="fill-muted text-[11px]"
          >
            {tick}
          </text>
        ))}
      <text
        x={(margin.left + width - margin.right) / 2}
        y={height - 8}
        textAnchor="middle"
        className="fill-text text-[12px]"
      >
        {xTitle}
      </text>
      <text
        transform={`translate(14 ${String((margin.top + height - margin.bottom) / 2)}) rotate(-90)`}
        textAnchor="middle"
        className="fill-text text-[12px]"
      >
        {yTitle}
      </text>
    </>
  );
}

function Marks({
  points,
  paretoIds,
  layout,
}: {
  points: ScatterPoint[];
  paretoIds: string[];
  layout: Layout;
}) {
  const { toX, toY } = layout;
  return (
    <>
      {points.map((point) => {
        const onFront = paretoIds.includes(point.id);
        return (
          <g key={point.id}>
            <circle
              cx={toX(point.x)}
              cy={toY(point.y)}
              r={onFront ? 7 : 5}
              fill={onFront ? "var(--accent)" : "var(--surface)"}
              stroke="var(--accent)"
              strokeWidth={2}
            >
              <title>{`${point.label}: ${String(point.x)}, ${String(point.y)}`}</title>
            </circle>
            <text x={toX(point.x) + 10} y={toY(point.y) - 8} className="fill-text text-[11px]">
              {point.label}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** A scatter of two quantities with a dashed line through the best trade-offs (Pareto set). */
export function Scatter({ points, paretoIds, xTitle, yTitle, title }: Props) {
  if (points.length === 0) return null;
  const layout = toLayout(points);
  const front = points.filter((point) => paretoIds.includes(point.id)).sort((a, b) => a.x - b.x);
  const line = front
    .map((point) => `${String(layout.toX(point.x))},${String(layout.toY(point.y))}`)
    .join(" ");
  return (
    <svg
      role="img"
      aria-label={`${title}: ${toSummary(points, paretoIds)}`}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      className="w-full max-w-[640px]"
    >
      <title>{title}</title>
      <Axes layout={layout} xTitle={xTitle} yTitle={yTitle} />
      {front.length > 1 ? (
        <polyline points={line} fill="none" stroke="var(--muted)" strokeDasharray="5 4" />
      ) : null}
      <Marks points={points} paretoIds={paretoIds} layout={layout} />
    </svg>
  );
}
