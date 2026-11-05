import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Flowsheet } from "@/shared/api/types";
import { LoadError } from "@/shared/forms/load-error";
import { Notice } from "@/shared/ui/notice";
import { toVersionEntries } from "@/shared/versions/diff";
import { VersionDetail, VersionList } from "@/shared/versions/history";
import { plantKeys, plantVersionQuery, plantVersionsQuery } from "./api";

type Props = {
  projectId: string;
  current: number;
  onRestore: (number: number) => void;
  initial?: number | undefined;
};

function toComparable(flowsheet: Flowsheet): Record<string, unknown> {
  return {
    modules: Object.fromEntries(
      flowsheet.modules.map((module) => [module.id, { type: module.type, title: module.title }]),
    ),
    connections: Object.fromEntries(
      flowsheet.connections.map((connection) => [
        `${connection.source} -> ${connection.target}`,
        { stream: connection.stream, kind: connection.kind },
      ]),
    ),
    spec: flowsheet.spec,
    structure: flowsheet.structure,
  };
}

/** The saved plant versions, newest first; a version opens read-only with its changes from the version before and a Restore button that loads it into the editor. */
export function HistoryPanel({ projectId, current, onRestore, initial }: Props) {
  const versions = useQuery(plantVersionsQuery(projectId));
  const queryClient = useQueryClient();
  const [opened, setOpened] = useState<number | null>(initial ?? null);
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
  if (version === undefined) {
    return <VersionList what="plant" versions={list} current={current} onOpen={setOpened} />;
  }
  const load = async (number: number) =>
    toVersionEntries(
      toComparable(await queryClient.fetchQuery(plantVersionQuery(projectId, number))),
    );
  return (
    <VersionDetail
      what="plant"
      queryKey={plantKeys.versions(projectId)}
      load={load}
      version={version}
      previous={list[index + 1]?.number}
      current={current}
      onBack={() => {
        setOpened(null);
      }}
      restore={
        <Button
          variant="default"
          aria-label={`Restore version ${String(version.number)}`}
          onClick={() => {
            onRestore(version.number);
          }}
        >
          Restore this version
        </Button>
      }
      notice={
        version.number === current ? null : (
          <p className="text-[13px] text-muted">
            Restore loads version {version.number} into the editor; save to keep it.
          </p>
        )
      }
    />
  );
}
