import { TableScroll } from "@/shared/ui/table-scroll";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toDisplayTime } from "@/shared/forms/display-time";
import { LoadError } from "@/shared/forms/load-error";
import { caseVersionsQuery } from "./api";

/** The table of saved case versions, newest first. */
export function HistoryPanel({ projectId, current }: { projectId: string; current: number }) {
  const versions = useQuery(caseVersionsQuery(projectId));
  if (versions.isPending) return <p className="text-muted">Loading the history…</p>;
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
    <Card>
      <TableScroll label="Saved versions">
        <table className="w-full border-collapse">
          <caption className="sr-only">Saved versions of the case</caption>
          <thead>
            <tr className="text-left text-muted">
              <th scope="col" className="p-2.5">
                Version
              </th>
              <th scope="col" className="p-2.5">
                Note
              </th>
              <th scope="col" className="p-2.5">
                Saved by
              </th>
              <th scope="col" className="p-2.5">
                Saved
              </th>
            </tr>
          </thead>
          <tbody>
            {versions.data.map((version) => (
              <tr key={version.number} className="border-t border-border">
                <td className="p-2.5 tabular-nums">
                  v{version.number}{" "}
                  {version.number === current ? <Badge variant="ok">current</Badge> : null}
                </td>
                <td className="p-2.5">{version.note}</td>
                <td className="p-2.5">{version.author.name}</td>
                <td className="p-2.5 tabular-nums">{toDisplayTime(version.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}
