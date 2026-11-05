import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/shared/api/errors";
import type { Version } from "@/shared/api/types";
import { toDisplayTime } from "@/shared/forms/display-time";
import { LoadError } from "@/shared/forms/load-error";
import { DataCell, DataTable, DataTableFrame, dataTableClass } from "@/shared/ui/data-table";
import { Notice } from "@/shared/ui/notice";
import { caseVersionQuery, caseVersionsQuery, useRestoreCase } from "./api";
import { toCaseChanges, toCaseEntries, type CaseChange } from "./version-diff";

type Props = {
  projectId: string;
  current: number;
  dirty: boolean;
  onRestored: () => void;
};

function toSavedBy(version: Version): string {
  const by = (version as Version & { by?: string }).by;
  return by === "assistant" ? "Assistant" : version.author.name;
}

/** The saved case versions, newest first; a version opens read-only with its changes from the version before and a Restore button. */
export function HistoryPanel({ projectId, current, dirty, onRestored }: Props) {
  const versions = useQuery(caseVersionsQuery(projectId));
  const [opened, setOpened] = useState<number | null>(null);
  if (versions.isPending) return <Notice status="loading" what="the history" />;
  if (versions.isError) {
    return (
      <LoadError
        error={versions.error}
        what="version history"
        onRetry={() => void versions.refetch()}
      />
    );
  }
  const list = versions.data;
  const index = list.findIndex((version) => version.number === opened);
  const version = list[index];
  if (opened !== null && version !== undefined) {
    return (
      <VersionView
        projectId={projectId}
        version={version}
        previous={list[index + 1]?.number}
        current={current}
        dirty={dirty}
        onBack={() => {
          setOpened(null);
        }}
        onRestored={onRestored}
      />
    );
  }
  return (
    <DataTable
      caption="Saved versions of the case"
      className="max-h-[60vh]"
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
      {list.map((item) => (
        <TableRow key={item.number} className="border-t border-border">
          <TableCell className="p-2.5 tabular-nums">
            v{item.number} {item.number === current ? <Badge variant="ok">current</Badge> : null}
          </TableCell>
          <DataCell className="px-3">{item.note}</DataCell>
          <DataCell className="px-3">{toSavedBy(item)}</DataCell>
          <TableCell className="p-2.5 tabular-nums">{toDisplayTime(item.created)}</TableCell>
          <TableCell className="p-2.5">
            <Button
              aria-label={`Open version ${String(item.number)}`}
              onClick={() => {
                setOpened(item.number);
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

type ViewProps = {
  projectId: string;
  version: Version;
  previous: number | undefined;
  current: number;
  dirty: boolean;
  onBack: () => void;
  onRestored: () => void;
};

function toRestoreFailure(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return "The case was saved again since this list was loaded. Go back to the list and try again.";
  }
  return error instanceof Error ? error.message : "The version could not be restored.";
}

function VersionView(props: ViewProps) {
  const { projectId, version, previous, current, dirty, onBack, onRestored } = props;
  const shown = useQuery(caseVersionQuery(projectId, version.number));
  const before = useQuery({
    ...caseVersionQuery(projectId, previous ?? 0),
    enabled: previous !== undefined,
  });
  const restore = useRestoreCase(projectId);
  const isCurrent = version.number === current;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          All versions
        </Button>
        <h3 className="text-base font-semibold">Version {version.number}</h3>
        <Badge variant="off">read-only</Badge>
        {isCurrent ? <Badge variant="ok">current</Badge> : null}
        <span className="flex-1" />
        {isCurrent ? null : (
          <Button
            variant="default"
            disabled={dirty || restore.isPending}
            title={dirty ? "Save or discard your changes first" : undefined}
            onClick={() => {
              restore.mutate({ number: version.number, base: current }, { onSuccess: onRestored });
            }}
          >
            Restore this version
          </Button>
        )}
      </div>
      <p className="text-[13px] text-muted">
        {version.note} · saved by {toSavedBy(version)} · {toDisplayTime(version.created)}
        {isCurrent
          ? null
          : ` · Restore saves its values and files as version ${String(current + 1)}.`}
      </p>
      {dirty && !isCurrent ? (
        <p className="text-[13px] text-warn">
          The case has unsaved changes: save or discard them before you restore.
        </p>
      ) : null}
      {restore.isError ? (
        <p role="alert" className="text-[13px] text-bad">
          {toRestoreFailure(restore.error)}
        </p>
      ) : null}
      {shown.isPending ? <Notice status="loading" what={`version ${String(version.number)}`} /> : null}
      {shown.isError ? (
        <LoadError
          error={shown.error}
          what={`version ${String(version.number)}`}
          onRetry={() => void shown.refetch()}
        />
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
              {before.isPending ? <Notice status="loading" what={`version ${String(previous)}`} /> : null}
              {before.isError ? (
                <LoadError
                  error={before.error}
                  what={`version ${String(previous)}`}
                  onRetry={() => void before.refetch()}
                />
              ) : null}
              {before.isSuccess ? (
                <ChangesTable
                  previous={previous}
                  number={version.number}
                  changes={toCaseChanges(
                    toCaseEntries(before.data.content, before.data.files),
                    toCaseEntries(shown.data.content, shown.data.files),
                  )}
                />
              ) : null}
            </TabsContent>
          )}
          <TabsContent value="values">
            <DataTable
              caption={`Values of case version ${String(version.number)}`}
              className="max-h-[55vh]"
              head={
                <>
                  <TableHead scope="col">Path</TableHead>
                  <TableHead scope="col">Value</TableHead>
                  <TableHead scope="col">Source</TableHead>
                </>
              }
            >
              {toCaseEntries(shown.data.content, shown.data.files).map((entry) => (
                <TableRow key={entry.path}>
                  <DataCell className="font-mono">{entry.path}</DataCell>
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

const kindLabel: Record<CaseChange["kind"], { text: string; variant: "ok" | "bad" | "info" }> = {
  added: { text: "added", variant: "ok" },
  removed: { text: "removed", variant: "bad" },
  changed: { text: "changed", variant: "info" },
};

function ChangesTable({
  previous,
  number,
  changes,
}: {
  previous: number;
  number: number;
  changes: CaseChange[];
}) {
  if (changes.length === 0) {
    return (
      <p className="py-3 text-[13px] text-muted">
        Version {number} has the same values and files as version {previous}.
      </p>
    );
  }
  return (
    <DataTableFrame
      caption={`Changes from case version ${String(previous)} to ${String(number)}`}
      className="max-h-[55vh]"
    >
      <TableHeader className={dataTableClass.header}>
        <TableRow>
          <TableHead scope="col">Path</TableHead>
          <TableHead scope="col">Change</TableHead>
          <TableHead scope="col">Version {previous}</TableHead>
          <TableHead scope="col">Version {number}</TableHead>
          <TableHead scope="col">Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.map((change) => (
          <TableRow key={change.path}>
            <DataCell className="font-mono">{change.path}</DataCell>
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
      </TableBody>
    </DataTableFrame>
  );
}
