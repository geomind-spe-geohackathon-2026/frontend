import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Flowsheet, ModulePorts, Palette } from "@/shared/api/types";
import { fromLayout, type Layout } from "@/shared/api/layout";
import { LoadError } from "@/shared/forms/load-error";
import { Notice } from "@/shared/ui/notice";
import { toVersionEntries } from "@/shared/versions/diff";
import { VersionDetail, VersionList } from "@/shared/versions/history";
import { Canvas } from "./canvas";
import { useAutoLayout, usePlantGraph } from "./use-auto-layout";
import { paletteQuery, plantKeys, plantVersionQuery, plantVersionsQuery, portsQuery } from "./api";

function noop() {
  return undefined;
}

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

function VersionCanvas({
  flowsheet,
  palette,
  catalog,
  changed,
}: {
  flowsheet: Flowsheet;
  palette: Palette[];
  catalog: ModulePorts[];
  changed: Set<string>;
}) {
  const [layout, setLayout] = useState<Layout>(() => fromLayout(flowsheet.layout));
  const graph = usePlantGraph(flowsheet.structure, catalog, palette);
  const place = useCallback((placed: Layout) => {
    setLayout((previous) => ({ ...previous, ...placed }));
  }, []);
  useAutoLayout(graph, layout, place);
  return (
    <Canvas
      graph={graph}
      layout={layout}
      palette={palette}
      issues={new Map()}
      selected={null}
      readOnly
      changed={changed}
      onSelect={noop}
      onMove={noop}
      onMoved={noop}
      onArrange={setLayout}
      onConnect={noop}
      onRemoveModule={noop}
      onRemoveConnection={noop}
      onDropModule={noop}
      suggested={new Map()}
      onDragPort={noop}
    />
  );
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
  const palette = useQuery(paletteQuery());
  const ports = useQuery(portsQuery());
  const label = `the flowsheet of version ${String(number)}`;
  if (shown.isError) {
    return <LoadError error={shown.error} what={label} onRetry={() => void shown.refetch()} />;
  }
  if (palette.isError || ports.isError) {
    return (
      <LoadError
        error={palette.error ?? ports.error}
        what="the module palette"
        onRetry={() => {
          void palette.refetch();
          void ports.refetch();
        }}
      />
    );
  }
  if (shown.data === undefined || palette.data === undefined || ports.data === undefined) {
    return <Notice status="loading" what={label} />;
  }
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
      <VersionCanvas
        flowsheet={shown.data}
        palette={palette.data}
        catalog={ports.data}
        changed={new Set(changed ?? [])}
      />
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
