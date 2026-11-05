import { useQuery } from "@tanstack/react-query";
import { toDisplayTime } from "@/shared/forms/display-time";
import { LoadError } from "@/shared/forms/load-error";
import { Button } from "@/components/ui/button";
import { DataCell, DataTableFrame, dataTableClass } from "@/shared/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { plantVersionsQuery } from "./api";
import type { Version } from "@/shared/api/types";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Notice } from "@/shared/ui/notice";

type Props = { projectId: string; current: number; onRestore: (number: number) => void };

/** The table of saved plant versions with a Restore button that loads a version into the editor. */
export function HistoryPanel({ projectId, current, onRestore }: Props) {
  const versions = useQuery(plantVersionsQuery(projectId));
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
  return (
    <DataTableFrame className="max-h-[60vh]">
        <TableCaption className="sr-only">Saved versions of the plant</TableCaption>
        <TableHeader className={dataTableClass.header}>
          <TableRow className="text-left text-muted">
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.data.map((version) => (
            <VersionRow
              key={version.number}
              version={version}
              current={current}
              onRestore={onRestore}
            />
          ))}
        </TableBody>
      </DataTableFrame>
  );
}

function VersionRow({
  version,
  current,
  onRestore,
}: {
  version: Version;
  current: number;
  onRestore: (number: number) => void;
}) {
  return (
    <TableRow className="border-t border-border">
      <TableCell className="p-2.5 tabular-nums">v{version.number}</TableCell>
      <DataCell className="px-3">{version.note}</DataCell>
      <DataCell className="px-3">{version.author.name}</DataCell>
      <TableCell className="p-2.5 tabular-nums">{toDisplayTime(version.created)}</TableCell>
      <TableCell className="p-2.5">
        {version.number === current ? (
          <Badge variant="ok">current</Badge>
        ) : (
          <Button
            aria-label={`Restore version ${String(version.number)}`}
            onClick={() => {
              onRestore(version.number);
            }}
          >
            Restore
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
