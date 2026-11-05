import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Flowsheet } from "@/shared/api/types";
import { LoadError } from "@/shared/forms/load-error";
import { Notice } from "@/shared/ui/notice";
import { ThemedImage } from "@/shared/ui/themed-image";
import { toFullFlowsheetSvg } from "@/shared/plant/flowsheet-svg";
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

function toModuleTexts(flowsheet: Flowsheet): Map<string, string> {
  const spec = flowsheet.spec as { modules?: Record<string, unknown> } | null | undefined;
  const specs = spec?.modules ?? {};
  return new Map(
    flowsheet.modules.map((module) => [
      module.id,
      JSON.stringify([module.type, module.title, specs[module.id] ?? null]),
    ]),
  );
}

/** The modules added or changed in a version against the one before, by id. */
function toChangedModules(before: Flowsheet, after: Flowsheet): string[] {
  const old = toModuleTexts(before);
  return [...toModuleTexts(after)].flatMap(([id, text]) => (old.get(id) === text ? [] : [id]));
}

/** The plant diagram of one saved version (every module and connection), with the modules changed from the version before. */
function VersionFlowsheet({
  projectId,
  number,
  previous,
}: {
  projectId: string;
  number: number;
  previous: number | undefined;
}) {
  const shown = useQuery(plantVersionQuery(projectId, number));
  const before = useQuery({
    ...plantVersionQuery(projectId, previous ?? 0),
    enabled: previous !== undefined,
  });
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    if (shown.data === undefined) return undefined;
    let active = true;
    const modules = shown.data.modules.map(({ id, type, category }) => ({ id, type, category }));
    const connections = shown.data.connections.map(({ source, target, stream }) => ({
      source,
      target,
      stream,
    }));
    void toFullFlowsheetSvg(modules, connections).then((picture) => {
      if (active) setSvg(picture);
    });
    return () => {
      active = false;
    };
  }, [shown.data]);
  const label = `the flowsheet of version ${String(number)}`;
  if (shown.isError) {
    return <LoadError error={shown.error} what={label} onRetry={() => void shown.refetch()} />;
  }
  if (shown.data === undefined || svg === null) return <Notice status="loading" what={label} />;
  if (shown.data.modules.length === 0) {
    return <p className="py-3 text-[13px] text-muted">Version {number} has no modules.</p>;
  }
  const changed = before.data === undefined ? null : toChangedModules(before.data, shown.data);
  return (
    <div className="space-y-2">
      {changed === null || previous === undefined ? null : (
        <p className="text-[13px] text-muted">
          {changed.length === 0
            ? `No module changed from version ${String(previous)}.`
            : `Modules added or changed from version ${String(previous)}: ${changed.join(", ")}.`}
        </p>
      )}
      <div className="max-h-[calc(100svh-22rem)] overflow-auto rounded-control border border-border bg-white">
        <ThemedImage svg={svg} alt={`Flowsheet of plant version ${String(number)}`} zoom />
      </div>
    </div>
  );
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
      views={[
        {
          value: "flowsheet",
          label: "Flowsheet",
          content: (
            <VersionFlowsheet
              projectId={projectId}
              number={version.number}
              previous={list[index + 1]?.number}
            />
          ),
        },
      ]}
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
