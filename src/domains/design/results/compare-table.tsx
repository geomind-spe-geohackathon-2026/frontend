import { Missing } from "@/shared/quantity/missing";
import { Quantity } from "@/shared/quantity/quantity";
import { Chip } from "@/shared/ui/chip";
import type { ResultComparison, Kpi } from "@/shared/api/types";
import { findKpi } from "./compare";

type Props = { comparison: ResultComparison; x: Kpi; y: Kpi };

function Cell({ kpi }: { kpi: Kpi | null }) {
  const value = kpi?.value ?? null;
  if (value === null) return <Missing blocks="the comparison" />;
  return <Quantity value={value} unit={kpi?.unit ?? ""} />;
}

/** The compared results as a table: both KPIs, checks passed and whether the result is on the Pareto line. */
export function CompareTable({ comparison, x, y }: Props) {
  return (
    <table className="w-full border-collapse text-left [&_td]:p-2 [&_th]:p-2">
      <caption className="sr-only">Compared results</caption>
      <thead>
        <tr>
          <th scope="col" className="text-[12.5px] font-medium text-muted">
            Result
          </th>
          <th scope="col" className="text-[12.5px] font-medium text-muted">
            {x.title}
          </th>
          <th scope="col" className="text-[12.5px] font-medium text-muted">
            {y.title}
          </th>
          <th scope="col" className="text-[12.5px] font-medium text-muted">
            Checks passed
          </th>
          <th scope="col" className="text-[12.5px] font-medium text-muted">
            Trade-off
          </th>
        </tr>
      </thead>
      <tbody>
        {comparison.items.map((item) => {
          const total = item.checks.passed + item.checks.failed + item.checks.not_assessed;
          return (
            <tr key={item.id}>
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
                {item.checks.passed} of {total}
              </td>
              <td>
                {comparison.pareto.includes(item.id) ? <Chip tone="ok">best trade-off</Chip> : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
