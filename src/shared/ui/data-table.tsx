import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";

const lineClass = "block max-w-60 truncate text-left";

/** A table cell that shows its text on one line, cut with an ellipsis, in a capped width; a click opens the full text beside it. */
export function DataCell({
  text,
  children,
  className,
}: {
  text: string;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (text === "") return <TableCell className={cn("py-1.5", className)}>{children}</TableCell>;
  const button = (
    <button
      type="button"
      title={open ? undefined : "Show the full text"}
      className={cn(lineClass, "cursor-pointer rounded-sm hover:bg-sunken")}
      onClick={() => {
        setOpen(true);
      }}
    >
      {children ?? text}
    </button>
  );
  return (
    <TableCell className={cn("py-1.5", className)}>
      {open ? (
        <Popover open onOpenChange={setOpen}>
          <PopoverTrigger asChild>{button}</PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-72 w-auto max-w-md overflow-auto text-[12.5px] whitespace-pre-wrap [overflow-wrap:anywhere]"
          >
            {text}
          </PopoverContent>
        </Popover>
      ) : (
        button
      )}
    </TableCell>
  );
}

/** A header cell cut to one line in the same capped width as a DataCell; the full name shows on hover. */
export function DataHead({ text, className }: { text: string; className?: string }) {
  return (
    <TableHead scope="col" title={text} className={className}>
      <span className={lineClass}>{text}</span>
    </TableHead>
  );
}

/** The shared data table: compact one-line rows, a header row that stays on top while the body scrolls, and scrolling both ways inside its box. Rows are TableRows of DataCells (or plain TableCells for buttons and badges). */
export function DataTable({
  caption,
  head,
  children,
  className,
}: {
  caption: string;
  head: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-0 overflow-hidden rounded-md border [&>[data-slot=table-container]]:h-full [&>[data-slot=table-container]]:overflow-auto",
        className,
      )}
    >
      <Table className="text-[12.5px]">
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
          <TableRow>{head}</TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
