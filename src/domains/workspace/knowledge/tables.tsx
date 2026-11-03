import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toDateLabel } from "@/lib/datelabel";
import type { ExperienceEntry, KnowledgeEntry, KnowledgeStatus } from "@/shared/api/pending";
import { tableCardClass } from "@/shared/ui/table-card";

const statusTone: Record<KnowledgeStatus, "ok" | "warn" | "off"> = {
  verified: "ok",
  secondary: "off",
  placeholder: "warn",
};

const cell = "px-3 py-2";

function Head({ names }: { names: string[] }) {
  return (
    <TableHeader className="text-muted">
      <TableRow>
        {names.map((name) => (
          <TableHead key={name} scope="col" className={`${cell} font-medium`}>
            {name}
          </TableHead>
        ))}
        <TableHead scope="col" className={cell}>
          <span className="sr-only">Action</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function Source({ entry }: { entry: KnowledgeEntry }) {
  const where = entry.page === null || entry.page === undefined ? null : `p. ${entry.page}`;
  const text = [entry.publisher, String(entry.year), where].filter(Boolean).join(", ");
  return (
    <span className="flex flex-col">
      {entry.link === null || entry.link === undefined ? (
        <span>{entry.title}</span>
      ) : (
        <a href={entry.link} target="_blank" rel="noreferrer" className="text-accent">
          {entry.title}
        </a>
      )}
      <span className="text-[12.5px] text-muted-foreground">{text}</span>
    </span>
  );
}

function toValueLabel(entry: KnowledgeEntry): string {
  const unit = entry.unit === null || entry.unit === undefined ? "" : ` ${entry.unit}`;
  const year =
    entry.price_year === null || entry.price_year === undefined
      ? ""
      : ` (${String(entry.price_year)})`;
  return `${String(entry.value)}${unit}${year}`;
}

/** The knowledge as a table: item, value with unit, source, status and a delete button. */
export function KnowledgeTable({
  entries,
  onDelete,
}: {
  entries: KnowledgeEntry[];
  onDelete: ((entry: KnowledgeEntry) => void) | undefined;
}) {
  return (
    <Card className={tableCardClass}>
      <Table className="w-full text-left">
        <TableCaption className="sr-only">Cited values</TableCaption>
        <Head names={["Item", "Value", "Source", "Status"]} />
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="border-t border-border">
              <TableCell className={`${cell} whitespace-normal`}>{entry.item}</TableCell>
              <TableCell className={`${cell} tabular-nums`}>{toValueLabel(entry)}</TableCell>
              <TableCell className={`${cell} whitespace-normal`}>
                <Source entry={entry} />
              </TableCell>
              <TableCell className={cell}>
                <Badge variant={statusTone[entry.status]}>{entry.status}</Badge>
              </TableCell>
              <TableCell className={`${cell} text-right`}>
                {onDelete === undefined ? null : (
                  <Button
                    aria-label={`Delete ${entry.item}`}
                    onClick={() => {
                      onDelete(entry);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function toVerdict(verdict: unknown): string {
  if (typeof verdict === "string") return verdict;
  if (verdict === undefined || verdict === null) return "";
  return JSON.stringify(verdict);
}

/** The experience as a table: past designs that passed verification, each opens in a window. */
export function ExperienceTable({
  entries,
  onOpen,
}: {
  entries: ExperienceEntry[];
  onOpen: (entry: ExperienceEntry) => void;
}) {
  return (
    <Card className={tableCardClass}>
      <Table className="w-full text-left">
        <TableCaption className="sr-only">Past designs</TableCaption>
        <Head names={["Design", "Verdict", "Added"]} />
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="border-t border-border">
              <TableCell className={`${cell} whitespace-normal`}>{entry.id}</TableCell>
              <TableCell className={`${cell} whitespace-normal`}>
                {toVerdict(entry.verdict)}
              </TableCell>
              <TableCell className={cell}>{toDateLabel(entry.created)}</TableCell>
              <TableCell className={`${cell} text-right`}>
                <Button
                  aria-label={`Open ${entry.id}`}
                  onClick={() => {
                    onOpen(entry);
                  }}
                >
                  Open
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
