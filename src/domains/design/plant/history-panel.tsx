import { useQuery } from "@tanstack/react-query";
import { toDisplayTime } from "@/shared/forms/display-time";
import { LoadError } from "@/shared/forms/load-error";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { plantVersionsQuery } from "./api";
import type { Version } from "@/shared/api/types";

type Props = { projectId: string; current: number; onRestore: (number: number) => void };

/** The table of saved plant versions with a Restore button that loads a version into the editor. */
export function HistoryPanel({ projectId, current, onRestore }: Props) {
  const versions = useQuery(plantVersionsQuery(projectId));
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
      <table className="w-full border-collapse">
        <caption className="sr-only">Saved versions of the plant</caption>
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
            <th scope="col" className="p-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {versions.data.map((version) => (
            <VersionRow
              key={version.number}
              version={version}
              current={current}
              onRestore={onRestore}
            />
          ))}
        </tbody>
      </table>
    </Card>
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
    <tr className="border-t border-border">
      <td className="p-2.5 tabular-nums">v{version.number}</td>
      <td className="p-2.5">{version.note}</td>
      <td className="p-2.5">{version.author.name}</td>
      <td className="p-2.5 tabular-nums">{toDisplayTime(version.created)}</td>
      <td className="p-2.5">
        {version.number === current ? (
          <Chip tone="ok">current</Chip>
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
      </td>
    </tr>
  );
}
