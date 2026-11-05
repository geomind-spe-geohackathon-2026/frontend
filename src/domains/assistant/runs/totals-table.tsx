import { Tokens } from "@/shared/quantity/usage";
import { Quantity } from "@/shared/quantity/quantity";
import type { Total } from "./totals";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { DataTableFrame, dataTableClass } from "@/shared/ui/data-table";

type Props = { caption: string; label: string; rows: Total[] };

/** A footer table of LLM calls with tokens and cost, per agent or per model. */
export function TotalsTable({ caption, label, rows }: Props) {
  return (
    <DataTableFrame className="max-h-[50vh]">
        <TableCaption className="mt-0 caption-top px-4 py-3 text-left font-medium text-foreground">
          {caption}
        </TableCaption>
        <TableHeader className={dataTableClass.header}>
          <TableRow className="text-muted">
            {[label, "Calls", "Tokens in", "Tokens out", "Cost"].map((name) => (
              <TableHead
                key={name}
                scope="col"
                className="border-y border-border px-3 py-1.5 font-medium"
              >
                {name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name} className="border-b border-border last:border-b-0">
              <TableHead scope="row" className="px-3 py-1.5 font-normal">
                {row.name}
              </TableHead>
              <TableCell className="px-3 py-1.5">{row.count}</TableCell>
              <TableCell className="px-3 py-1.5">
                <Tokens value={row.input} />
              </TableCell>
              <TableCell className="px-3 py-1.5">
                <Tokens value={row.output} />
              </TableCell>
              <TableCell className="px-3 py-1.5">
                <Quantity value={row.cost} unit="USD" fractionDigits={3} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTableFrame>
  );
}
