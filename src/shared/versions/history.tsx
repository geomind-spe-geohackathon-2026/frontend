import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Version } from "@/shared/api/types";
import { toDisplayTime } from "@/shared/forms/display-time";
import { LoadError } from "@/shared/forms/load-error";
import { DataCell, DataTable } from "@/shared/ui/data-table";
import { Notice } from "@/shared/ui/notice";
import { toVersionChanges, type VersionChange, type VersionEntry } from "./diff";

/** Names who saved a version: "Assistant" when the assistant saved it (Version.by), otherwise the user. */
export function toSavedBy(version: Version): string {
  const by = (version as Version & { by?: string }).by;
  return by === "assistant" ? "Assistant" : version.author.name;
}

type ListProps = {
  what: string;
  versions: Version[];
  current: number;
  onOpen: (number: number) => void;
};

/** The table of saved versions, newest first, with the full note, who saved it and an Open button per row. */
export function VersionList({ what, versions, current, onOpen }: ListProps) {
  return (
    <DataTable
      caption={`Saved versions of the ${what}`}
      className="max-h-[60vh]"
      numbered={false}
      head={
        <>
          <TableHead scope="col" className="p-2.5">
            Version
          </TableHead>
          <TableHead scope="col" className="p-2.5">
            Note
          </TableHead>
          <TableHead scope="col" className="p-2.5">
            Saved by
          </TableHead>
          <TableHead scope="col" className="p-2.5">
            Saved
          </TableHead>
          <TableHead scope="col" className="p-2.5">
            <span className="sr-only">Actions</span>
          </TableHead>
        </>
      }
    >
      {versions.map((item) => (
        <TableRow key={item.number} className="border-t border-border">
          <TableCell className="p-2.5 align-top whitespace-nowrap tabular-nums">
            v{item.number} {item.number === current ? <Badge variant="ok">current</Badge> : null}
          </TableCell>
          <TableCell className="min-w-64 p-2.5 align-top whitespace-normal">{item.note}</TableCell>
          <TableCell className="p-2.5 align-top whitespace-nowrap">{toSavedBy(item)}</TableCell>
          <TableCell className="p-2.5 align-top whitespace-nowrap tabular-nums">
            {toDisplayTime(item.created)}
          </TableCell>
          <TableCell className="p-2.5 align-top">
            <Button
              aria-label={`Open version ${String(item.number)}`}
              onClick={() => {
                onOpen(item.number);
              }}
            >
              Open
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </DataTable>
  );
}

type DetailProps = {
  what: string;
  queryKey: readonly unknown[];
  load: (number: number) => Promise<VersionEntry[]>;
  version: Version;
  previous: number | undefined;
  current: number;
  restore: ReactNode;
  notice?: ReactNode;
  onBack: () => void;
};

/** One saved version, read-only: its changes from the version before and all its values, with a restore action. */
export function VersionDetail(props: DetailProps) {
  const { what, queryKey, load, version, previous, current, restore, notice, onBack } = props;
  const shown = useQuery({
    queryKey: [...queryKey, version.number, "entries"],
    queryFn: () => load(version.number),
    staleTime: Infinity,
  });
  const before = useQuery({
    queryKey: [...queryKey, previous ?? 0, "entries"],
    queryFn: () => load(previous ?? 0),
    staleTime: Infinity,
    enabled: previous !== undefined,
  });
  const isCurrent = version.number === current;
  const label = `version ${String(version.number)}`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          All versions
        </Button>
        <h3 className="text-base font-semibold">
          {what === "case" ? "Case" : "Plant"} version {version.number}
        </h3>
        <Badge variant="off">read-only</Badge>
        {isCurrent ? <Badge variant="ok">current</Badge> : null}
        <span className="flex-1" />
        {isCurrent ? null : restore}
      </div>
      <p className="text-[13px] text-muted">
        {version.note} · saved by {toSavedBy(version)} · {toDisplayTime(version.created)}
      </p>
      {notice}
      {shown.isPending ? <Notice status="loading" what={label} /> : null}
      {shown.isError ? (
        <LoadError error={shown.error} what={label} onRetry={() => void shown.refetch()} />
      ) : null}
      {shown.isSuccess ? (
        <Tabs defaultValue={previous === undefined ? "values" : "changes"}>
          <TabsList>
            {previous === undefined ? null : (
              <TabsTrigger value="changes">Changes from version {previous}</TabsTrigger>
            )}
            <TabsTrigger value="values">All values</TabsTrigger>
          </TabsList>
          {previous === undefined ? null : (
            <TabsContent value="changes">
              {before.isPending ? (
                <Notice status="loading" what={`version ${String(previous)}`} />
              ) : null}
              {before.isError ? (
                <LoadError
                  error={before.error}
                  what={`version ${String(previous)}`}
                  onRetry={() => void before.refetch()}
                />
              ) : null}
              {before.isSuccess ? (
                <ChangesTable
                  what={what}
                  previous={previous}
                  number={version.number}
                  changes={toVersionChanges(before.data, shown.data)}
                />
              ) : null}
            </TabsContent>
          )}
          <TabsContent value="values">
            <DataTable
              caption={`Values of ${what} ${label}`}
              className="max-h-[55vh]"
              head={
                <>
                  <TableHead scope="col">Path</TableHead>
                  <TableHead scope="col">Value</TableHead>
                  <TableHead scope="col">Source</TableHead>
                </>
              }
            >
              {shown.data.map((entry) => (
                <TableRow key={entry.path}>
                  <TableCell className="font-mono whitespace-nowrap">{entry.path}</TableCell>
                  <DataCell>{entry.value}</DataCell>
                  <DataCell className="text-muted">{entry.source}</DataCell>
                </TableRow>
              ))}
            </DataTable>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

const kindLabel: Record<VersionChange["kind"], { text: string; variant: "ok" | "bad" | "info" }> = {
  added: { text: "added", variant: "ok" },
  removed: { text: "removed", variant: "bad" },
  changed: { text: "changed", variant: "info" },
};

function ChangesTable({
  what,
  previous,
  number,
  changes,
}: {
  what: string;
  previous: number;
  number: number;
  changes: VersionChange[];
}) {
  if (changes.length === 0) {
    return (
      <p className="py-3 text-[13px] text-muted">
        Version {number} has the same values as version {previous}.
      </p>
    );
  }
  return (
    <DataTable
      caption={`Changes of the ${what} from version ${String(previous)} to ${String(number)}`}
      className="max-h-[55vh]"
      head={
        <>
          <TableHead scope="col">Path</TableHead>
          <TableHead scope="col">Change</TableHead>
          <TableHead scope="col">Version {previous}</TableHead>
          <TableHead scope="col">Version {number}</TableHead>
          <TableHead scope="col">Source</TableHead>
        </>
      }
    >
      {changes.map((change) => (
        <TableRow key={change.path}>
          <TableCell className="font-mono whitespace-nowrap">{change.path}</TableCell>
          <TableCell>
            <Badge variant={kindLabel[change.kind].variant}>{kindLabel[change.kind].text}</Badge>
          </TableCell>
          <DataCell className="text-muted">{change.before?.value}</DataCell>
          <DataCell>{change.after?.value}</DataCell>
          <DataCell className="text-muted">
            {change.after?.source ?? change.before?.source}
          </DataCell>
        </TableRow>
      ))}
    </DataTable>
  );
}
