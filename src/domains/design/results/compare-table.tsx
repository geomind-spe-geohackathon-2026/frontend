import { Missing } from "@/shared/quantity/missing";
import { Quantity } from "@/shared/quantity/quantity";
import { Chip } from "@/shared/ui/chip";
import type { Kpi, Result, ResultComparison } from "@/shared/api/types";
import { findKpi, toBestId, toChecksText } from "./compare";

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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left [&_td]:p-2 [&_th]:p-2">
        <caption className="sr-only">Compared designs</caption>
        <thead>
          <tr>
            {["Design", x.title, y.title, "Investment", "Doublets", "Depth", "Checks", ""].map(
              (name) => (
                <th key={name} scope="col" className={headClass}>
                  {name}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {comparison.items.map((item) => (
            <tr key={item.id} className={item.id === best ? "bg-accent-soft" : ""}>
              <th scope="row" className="text-left font-medium">
                {item.name}
              </th>
              <td>
                <Cell kpi={findKpi(item, x.name)} />
              </td>
              <td>
                <Cell kpi={findKpi(item, y.name)} />
              </td>
              <td>
                <Cell kpi={findKpi(item, "capex")} />
              </td>
              <td>{item.doublets ?? "-"}</td>
              <td>{toDepth(item)}</td>
              <td>
                <Checks item={item} />
              </td>
              <td>
                {pareto.includes(item.id) ? (
                  <Chip tone="ok" title="No other design here is better on both figures.">
                    on the trade-off line
                  </Chip>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
