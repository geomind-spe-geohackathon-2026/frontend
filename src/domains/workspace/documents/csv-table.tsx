import Papa from "papaparse";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rowLimit = 2000;

/** Splits CSV or TSV text into rows (papaparse guesses the delimiter and handles quoted commas). */
export function toCsvRows(text: string): string[][] {
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  return parsed.data;
}

/** A CSV file as a table: the first row as a sticky header, long cells wrapped, scrolling both ways. */
export function CsvTable({ text }: { text: string }) {
  const [head = [], ...rows] = toCsvRows(text);
  const shown = rows.slice(0, rowLimit);
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
      <Table className="text-[12.5px]">
        <TableCaption className="sr-only">File contents</TableCaption>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            {head.map((cell, index) => (
              <TableHead key={index} scope="col" className="whitespace-nowrap">
                {cell}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, column) => (
                <TableCell
                  key={column}
                  className="max-w-[28rem] align-top whitespace-normal [overflow-wrap:anywhere]"
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > rowLimit ? (
        <p className="p-2 text-[12px] text-muted-foreground">
          Showing the first {rowLimit} of {rows.length} rows.
        </p>
      ) : null}
    </div>
  );
}
