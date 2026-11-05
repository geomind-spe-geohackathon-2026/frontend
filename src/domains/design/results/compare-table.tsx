import { formatFigure } from "@/shared/quantity/figure";
import { Missing } from "@/shared/quantity/missing";
import { Quantity } from "@/shared/quantity/quantity";
import { Badge } from "@/components/ui/badge";
import type { Kpi, Result, ResultComparison } from "@/shared/api/types";
import { findKpi, toBestId, toChecksText } from "./compare";
import { TableCell, TableRow } from "@/components/ui/table";
import { DataCell, DataHead, DataTable } from "@/shared/ui/data-table";

type Props = { comparison: ResultComparison; x: Kpi; y: Kpi; pareto: string[] };

const countHint = "Counts differ between designs because each doublet has its own checks.";

function Cell({ kpi }: { kpi: Kpi | null }) {
  const value = kpi?.value ?? null;
  if (value === null) return <Missing blocks="the comparison" />;
  return <Quantity value={value} unit={kpi?.unit ?? ""} />;
}

function Checks({ item }: { item: Result }) {
  const total = item.checks.passed + item.checks.failed + item.checks.not_assessed;
  return (
    <span title={`${String(item.checks.passed)} of ${String(total)}. ${countHint}`}>
      {toChecksText(item)}
    </span>
  );
}

function toDepth(item: Result): string {
  return item.depth === null ? "-" : `${formatFigure(item.depth)} ${item.depth_unit ?? ""}`;
}

/** The compared designs as a table: the two figures, what sets them apart, and their checks. */
export function CompareTable({ comparison, x, y, pareto }: Props) {
  const best = toBestId(comparison.items, y.name);
  return (
    <DataTable
      caption="Compared designs"
      className="max-h-[70vh]"
      head={["Design", x.title, y.title, "Investment", "Doublets", "Depth", "Checks", ""].map(
        (name, index) => (
          <DataHead key={index}>{name}</DataHead>
        ),
      )}
    >
      {comparison.items.map((item) => (
        <TableRow key={item.id} className={item.id === best ? "bg-accent-soft" : ""}>
          <DataCell className="font-medium">{item.name}</DataCell>
          <TableCell className="py-1.5 tabular-nums">
            <Cell kpi={findKpi(item, x.name)} />
          </TableCell>
          <TableCell className="py-1.5 tabular-nums">
            <Cell kpi={findKpi(item, y.name)} />
          </TableCell>
          <TableCell className="py-1.5 tabular-nums">
            <Cell kpi={findKpi(item, "capex")} />
          </TableCell>
          <TableCell className="py-1.5 tabular-nums">{item.doublets ?? "-"}</TableCell>
          <TableCell className="py-1.5 tabular-nums">{toDepth(item)}</TableCell>
          <TableCell className="py-1.5 tabular-nums">
            <Checks item={item} />
          </TableCell>
          <TableCell className="py-1.5 tabular-nums">
            {pareto.includes(item.id) ? (
              <Badge variant="ok" title="No other design here is better on both figures.">
                on the trade-off line
              </Badge>
            ) : null}
          </TableCell>
        </TableRow>
      ))}
    </DataTable>
  );
}
