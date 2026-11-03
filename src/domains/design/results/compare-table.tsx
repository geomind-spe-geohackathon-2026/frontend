import { Missing } from "@/shared/quantity/missing";
import { Quantity } from "@/shared/quantity/quantity";
import { Badge } from "@/components/ui/badge";
import type { Kpi, Result, ResultComparison } from "@/shared/api/types";
import { findKpi, toBestId, toChecksText } from "./compare";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

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
  return item.depth === null ? "-" : `${String(item.depth)} ${item.depth_unit ?? ""}`;
}

const headClass = "text-[12.5px] font-medium text-muted";

/** The compared designs as a table: the two figures, what sets them apart, and their checks. */
export function CompareTable({ comparison, x, y, pareto }: Props) {
  const best = toBestId(comparison.items, y.name);
  return (
    <Table className="w-full border-collapse text-left [&_td]:p-2 [&_th]:p-2">
      <TableCaption className="sr-only">Compared designs</TableCaption>
      <TableHeader>
        <TableRow>
          {["Design", x.title, y.title, "Investment", "Doublets", "Depth", "Checks", ""].map(
            (name) => (
              <TableHead key={name} scope="col" className={headClass}>
                {name}
              </TableHead>
            ),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {comparison.items.map((item) => (
          <TableRow key={item.id} className={item.id === best ? "bg-accent-soft" : ""}>
            <TableHead scope="row" className="text-left font-medium">
              {item.name}
            </TableHead>
            <TableCell>
              <Cell kpi={findKpi(item, x.name)} />
            </TableCell>
            <TableCell>
              <Cell kpi={findKpi(item, y.name)} />
            </TableCell>
            <TableCell>
              <Cell kpi={findKpi(item, "capex")} />
            </TableCell>
            <TableCell>{item.doublets ?? "-"}</TableCell>
            <TableCell>{toDepth(item)}</TableCell>
            <TableCell>
              <Checks item={item} />
            </TableCell>
            <TableCell>
              {pareto.includes(item.id) ? (
                <Badge variant="ok" title="No other design here is better on both figures.">
                  on the trade-off line
                </Badge>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
