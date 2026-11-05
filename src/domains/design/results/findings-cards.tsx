import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatFigure } from "@/shared/quantity/figure";
import type { ResultDetail } from "@/shared/api/types";
import { TableRow } from "@/components/ui/table";
import { DataCell, DataHead, DataTable } from "@/shared/ui/data-table";

function toFigure(value: number | null): string {
  return value === null ? "-" : formatFigure(value);
}

function EndValue({
  value,
  feasible,
}: {
  value: number | null;
  feasible?: boolean | null | undefined;
}) {
  return (
    <>
      {toFigure(value)}
      {feasible === false ? <span className="text-muted"> (infeasible)</span> : null}
    </>
  );
}

/** The effect of each uncertain value on a metric, the largest first. */
export function TornadoCard({ rows }: { rows: NonNullable<ResultDetail["tornado"]> }) {
  return (
    <Card className="mb-3.5">
      <CardHeader>
        <h2>Sensitivity</h2>
      </CardHeader>
      <CardContent>
        <DataTable
          caption="How each uncertain value moves each metric"
          className="max-h-[70vh]"
          head={["Value", "Metric", "Low", "High", "At low", "At high", "Effect"].map((name) => (
            <DataHead key={name}>{name}</DataHead>
          ))}
        >
          {rows.map((row) => (
            <TableRow key={`${row.parameter}-${row.metric}`} className="tabular-nums">
              <DataCell className="font-mono">{row.parameter}</DataCell>
              <DataCell>{row.metric}</DataCell>
              <DataCell>{row.low}</DataCell>
              <DataCell>{row.high}</DataCell>
              <DataCell>
                <EndValue value={row.at_low} feasible={row.feasible_low} />
              </DataCell>
              <DataCell>
                <EndValue value={row.at_high} feasible={row.feasible_high} />
              </DataCell>
              <DataCell>
                {toFigure(row.effect)} {row.unit}
              </DataCell>
            </TableRow>
          ))}
        </DataTable>
      </CardContent>
    </Card>
  );
}

function toSpreadTitle(row: NonNullable<ResultDetail["spread"]>[number] | undefined): string {
  const title = `Uncertainty over ${String(row?.draws ?? 0)} draws`;
  const feasible = row?.feasible ?? null;
  return feasible === null ? title : `${title}, ${String(feasible)} feasible`;
}

/** The mean and percentiles of each metric over the draws of an uncertainty study. */
export function SpreadCard({ rows }: { rows: NonNullable<ResultDetail["spread"]> }) {
  return (
    <Card className="mb-3.5">
      <CardHeader>
        <h2>{toSpreadTitle(rows[0])}</h2>
      </CardHeader>
      <CardContent>
        <DataTable
          caption="Spread of each metric"
          className="max-h-[70vh]"
          head={["Metric", "Mean", "5th percentile", "Median", "95th percentile"].map((name) => (
            <DataHead key={name}>{name}</DataHead>
          ))}
        >
          {rows.map((row) => (
            <TableRow key={row.metric} className="tabular-nums">
              <DataCell>
                {row.metric} <span className="text-muted">{row.unit}</span>
              </DataCell>
              <DataCell>{toFigure(row.mean)}</DataCell>
              <DataCell>{toFigure(row.p5)}</DataCell>
              <DataCell>{toFigure(row.p50)}</DataCell>
              <DataCell>{toFigure(row.p95)}</DataCell>
            </TableRow>
          ))}
        </DataTable>
      </CardContent>
    </Card>
  );
}
