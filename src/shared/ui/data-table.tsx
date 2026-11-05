import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
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

/** Classes of the shared data table: the bordered box whose table container scrolls both ways, and the header row that stays on top. */
export const dataTableClass = {
  box: "min-h-0 overflow-hidden rounded-md border [&>[data-slot=table-container]]:h-full [&>[data-slot=table-container]]:max-h-[inherit] [&>[data-slot=table-container]]:overflow-auto",
  header: "sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]",
};

/** A table cell that shows its content on one line, cut with an ellipsis, in a capped width; a click on a cut cell opens the full content beside it. */
export function DataCell({ children, className }: { children?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const line = useRef<HTMLSpanElement>(null);
  const openIfCut = () => {
    const element = line.current;
    if (element !== null && element.scrollWidth > element.clientWidth) setOpen(true);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openIfCut();
    }
  };
  const cell = (
    <span
      ref={line}
      role="button"
      tabIndex={0}
      className={cn(lineClass, "cursor-pointer rounded-sm hover:bg-sunken")}
      onClick={openIfCut}
      onKeyDown={onKey}
    >
      {children}
    </span>
  );
  return (
    <TableCell className={cn("py-1.5", className)}>
      {open ? (
        <Popover open onOpenChange={setOpen}>
          <PopoverAnchor asChild>{cell}</PopoverAnchor>
          <PopoverContent
            align="start"
            className="max-h-72 w-auto max-w-md overflow-auto text-[12.5px] whitespace-pre-wrap [overflow-wrap:anywhere]"
          >
            {children}
          </PopoverContent>
        </Popover>
      ) : (
        cell
      )}
    </TableCell>
  );
}

/** A header cell cut to one line in the same capped width as a DataCell; the full name shows on hover when it is text. */
export function DataHead({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <TableHead
      scope="col"
      title={typeof children === "string" ? children : undefined}
      className={className}
    >
      <span className={lineClass}>{children}</span>
    </TableHead>
  );
}

/** The box of the shared data table around a caption and the caller's own TableHeader (give it dataTableClass.header) and TableBody, for tables with row headers or several header rows. */
export function DataTableFrame({
  caption,
  children,
  className,
}: {
  caption: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn(dataTableClass.box, className)}>
      <Table className="text-[12.5px]">
        <TableCaption className="sr-only">{caption}</TableCaption>
        {children}
      </Table>
    </div>
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
  className?: string | undefined;
}) {
  return (
    <DataTableFrame caption={caption} className={className}>
      <TableHeader className={dataTableClass.header}>
        <TableRow>{head}</TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </DataTableFrame>
  );
}
