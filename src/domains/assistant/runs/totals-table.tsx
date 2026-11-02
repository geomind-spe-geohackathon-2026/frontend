import { Quantity } from "@/shared/quantity/quantity";
import type { Total } from "./totals";

type Props = { caption: string; label: string; rows: Total[] };

/** A footer table of LLM calls with tokens and cost, per agent or per model. */
export function TotalsTable({ caption, label, rows }: Props) {
  return (
    <table className="w-full border-collapse rounded-card border border-border bg-surface text-left">
      <caption className="px-3 py-2 text-left font-medium">{caption}</caption>
      <thead>
        <tr className="text-muted">
          {[label, "Calls", "Tokens in", "Tokens out", "Cost"].map((name) => (
            <th key={name} scope="col" className="border-y border-border px-3 py-1.5 font-medium">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-b border-border last:border-b-0">
            <th scope="row" className="px-3 py-1.5 font-normal">
              {row.name}
            </th>
            <td className="px-3 py-1.5">{row.count}</td>
            <td className="px-3 py-1.5">
              <Quantity value={row.input} unit="" fractionDigits={0} />
            </td>
            <td className="px-3 py-1.5">
              <Quantity value={row.output} unit="" fractionDigits={0} />
            </td>
            <td className="px-3 py-1.5">
              <Quantity value={row.cost} unit="USD" fractionDigits={3} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
