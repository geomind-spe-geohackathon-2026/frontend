import Papa from "papaparse";
import { TableRow } from "@/components/ui/table";
import { DataCell, DataHead, DataTable } from "@/shared/ui/data-table";

const rowLimit = 2000;

/** Splits CSV or TSV text into rows (papaparse guesses the delimiter and handles quoted commas). */
export function toCsvRows(text: string): string[][] {
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  return parsed.data;
}

/** A CSV file in the shared data table: one-line cells that open in full on a click, a header that stays on top, scrolling both ways. */
export function CsvTable({ text }: { text: string }) {
  const [head = [], ...rows] = toCsvRows(text);
  const shown = rows.slice(0, rowLimit);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <DataTable
        caption="File contents"
        className="flex-1"
        head={head.map((cell, index) => (
          <DataHead key={index}>{cell}</DataHead>
        ))}
      >
        {shown.map((row, index) => (
          <TableRow key={index}>
            {row.map((cell, column) => (
              <DataCell key={column}>{cell}</DataCell>
            ))}
          </TableRow>
        ))}
      </DataTable>
      {rows.length > rowLimit ? (
        <p className="text-[12px] text-muted-foreground">
          Showing the first {rowLimit} of {rows.length} rows.
        </p>
      ) : null}
    </div>
  );
}
