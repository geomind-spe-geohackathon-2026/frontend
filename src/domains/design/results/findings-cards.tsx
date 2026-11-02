import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import { formatFigure } from "@/shared/quantity/figure";
import type { ResultDetail } from "@/shared/api/types";

const cellClass = "[&_td]:p-2 [&_th]:p-2 [&_th]:text-[12.5px] [&_th]:font-medium [&_th]:text-muted";

function toFigure(value: number | null): string {
  return value === null ? "-" : formatFigure(value);
}

/** The effect of each uncertain value on a metric, the largest first. */
export function TornadoCard({ rows }: { rows: NonNullable<ResultDetail["tornado"]> }) {
  return (
    <Card className="mb-3.5">
      <CardHeader>
        <h2>Sensitivity</h2>
      </CardHeader>
      <CardBody className="overflow-x-auto">
        <table className={`w-full border-collapse text-left ${cellClass}`}>
          <caption className="sr-only">How each uncertain value moves each metric</caption>
          <thead>
            <tr>
              {["Value", "Metric", "Low", "High", "At low", "At high", "Effect"].map((name) => (
                <th key={name} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.parameter}-${row.metric}`} className="tabular-nums">
                <th scope="row" className="font-mono">
                  {row.parameter}
                </th>
                <td>{row.metric}</td>
                <td>{row.low}</td>
                <td>{row.high}</td>
                <td>{toFigure(row.at_low)}</td>
                <td>{toFigure(row.at_high)}</td>
                <td>
                  {toFigure(row.effect)} {row.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}

/** The mean and percentiles of each metric over the draws of an uncertainty study. */
export function SpreadCard({ rows }: { rows: NonNullable<ResultDetail["spread"]> }) {
  return (
    <Card className="mb-3.5">
      <CardHeader>
        <h2>Uncertainty over {rows[0]?.draws ?? 0} draws</h2>
      </CardHeader>
      <CardBody className="overflow-x-auto">
        <table className={`w-full border-collapse text-left ${cellClass}`}>
          <caption className="sr-only">Spread of each metric</caption>
          <thead>
            <tr>
              {["Metric", "Mean", "5th percentile", "Median", "95th percentile"].map((name) => (
                <th key={name} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="tabular-nums">
                <th scope="row">
                  {row.metric} <span className="text-muted">{row.unit}</span>
                </th>
                <td>{toFigure(row.mean)}</td>
                <td>{toFigure(row.p5)}</td>
                <td>{toFigure(row.p50)}</td>
                <td>{toFigure(row.p95)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
