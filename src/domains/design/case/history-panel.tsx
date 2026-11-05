import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { toDisplayTime } from "@/shared/forms/display-time";
import { LoadError } from "@/shared/forms/load-error";
import { caseVersionsQuery } from "./api";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Notice } from "@/shared/ui/notice";
import { DataCell, DataTableFrame, dataTableClass } from "@/shared/ui/data-table";

/** The table of saved case versions, newest first. */
export function HistoryPanel({ projectId, current }: { projectId: string; current: number }) {
  const versions = useQuery(caseVersionsQuery(projectId));
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
        <TableCaption className="sr-only">Saved versions of the case</TableCaption>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.data.map((version) => (
            <TableRow key={version.number} className="border-t border-border">
              <TableCell className="p-2.5 tabular-nums">
                v{version.number}{" "}
                {version.number === current ? <Badge variant="ok">current</Badge> : null}
              </TableCell>
              <DataCell className="px-3">{version.note}</DataCell>
              <DataCell className="px-3">{version.author.name}</DataCell>
              <TableCell className="p-2.5 tabular-nums">{toDisplayTime(version.created)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTableFrame>
  );
}
