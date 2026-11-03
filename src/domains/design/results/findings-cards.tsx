import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatFigure } from "@/shared/quantity/figure";
import type { ResultDetail } from "@/shared/api/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

const cellClass = "[&_td]:p-2 [&_th]:p-2 [&_th]:text-[12.5px] [&_th]:font-medium [&_th]:text-muted";

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
        <Table className={`w-full border-collapse text-left ${cellClass}`}>
          <TableCaption className="sr-only">
            How each uncertain value moves each metric
          </TableCaption>
          <TableHeader>
            <TableRow>
              {["Value", "Metric", "Low", "High", "At low", "At high", "Effect"].map((name) => (
                <TableHead key={name} scope="col">
                  {name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.parameter}-${row.metric}`} className="tabular-nums">
                <TableHead scope="row" className="font-mono">
                  {row.parameter}
                </TableHead>
                <TableCell>{row.metric}</TableCell>
                <TableCell>{row.low}</TableCell>
                <TableCell>{row.high}</TableCell>
                <TableCell>
                  <EndValue value={row.at_low} feasible={row.feasible_low} />
                </TableCell>
                <TableCell>
                  <EndValue value={row.at_high} feasible={row.feasible_high} />
                </TableCell>
                <TableCell>
                  {toFigure(row.effect)} {row.unit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
        <Table className={`w-full border-collapse text-left ${cellClass}`}>
          <TableCaption className="sr-only">Spread of each metric</TableCaption>
          <TableHeader>
            <TableRow>
              {["Metric", "Mean", "5th percentile", "Median", "95th percentile"].map((name) => (
                <TableHead key={name} scope="col">
                  {name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.metric} className="tabular-nums">
                <TableHead scope="row">
                  {row.metric} <span className="text-muted">{row.unit}</span>
                </TableHead>
                <TableCell>{toFigure(row.mean)}</TableCell>
                <TableCell>{toFigure(row.p5)}</TableCell>
                <TableCell>{toFigure(row.p50)}</TableCell>
                <TableCell>{toFigure(row.p95)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
