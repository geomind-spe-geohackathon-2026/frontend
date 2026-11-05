import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, toData } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { StudyStructure, StudyStructures } from "@/shared/api/pending";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Notice } from "@/shared/ui/notice";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tableCardClass } from "@/shared/ui/table-card";

const limit = 10;
const compareMost = 3;
const figure = new Intl.NumberFormat("en", { maximumSignificantDigits: 4 });

function structuresQuery(studyId: string) {
  return {
    queryKey: ["study-structures", studyId, limit],
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      toData(
        await api.GET("/design/study/{study_id}/structures", {
          params: { path: { study_id: studyId }, query: { limit } },
          signal,
        }),
      ),
  };
}

function toWords(name: string): string {
  const words = name.replaceAll("_", " ").replaceAll(".", " › ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toChoice(value: unknown): string {
  if (value === true) return "with";
  if (value === false) return "without";
  return typeof value === "string" || typeof value === "number" ? String(value) : JSON.stringify(value);
}

function toStructureText(structure: Record<string, unknown>): string {
  const parts = Object.entries(structure).map(([name, value]) =>
    typeof value === "boolean" ? `${toChoice(value)} ${toWords(name).toLowerCase()}` : `${toWords(name)}: ${toChoice(value)}`,
  );
  return parts.length === 0 ? "The base structure" : parts.join(", ");
}

function toValueText(value: unknown): string {
  if (typeof value === "number") return figure.format(value);
  if (typeof value === "object" && value !== null && "value" in value) {
    const { value: inner, unit } = value as { value: unknown; unit?: unknown };
    const shown = typeof inner === "number" ? figure.format(inner) : String(inner);
    return typeof unit === "string" && unit !== "" && unit !== "-" ? `${shown} ${unit}` : shown;
  }
  return value === null || value === undefined ? "–" : String(value);
}

function toObjectiveName(objective: string): string {
  return objective.startsWith("-") ? `${toWords(objective.slice(1))} (max)` : `${toWords(objective)} (min)`;
}

function toKeys(rows: StudyStructure[], pick: (row: StudyStructure) => Record<string, unknown>): string[] {
  return [...new Set(rows.flatMap((row) => Object.keys(pick(row))))];
}

function Feasible({ row }: { row: StudyStructure }) {
  if (row.feasible) return <Badge variant="ok">feasible</Badge>;
  return (
    <span className="flex flex-col gap-0.5">
      <Badge variant="bad">infeasible</Badge>
      {row.reason === null || row.reason === undefined ? null : (
        <span className="text-[12px] text-muted [overflow-wrap:anywhere]">{row.reason}</span>
      )}
    </span>
  );
}

const notStored = "Plant not stored for this structure yet";

function isNotStored(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function RowActions({ studyId, row }: { studyId: string; row: StudyStructure }) {
  const projectId = useRequiredParam("projectId");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const path = { study_id: studyId, rank: row.rank };
  const plant = useQuery({
    queryKey: ["structure-plant", studyId, row.rank],
    queryFn: async ({ signal }) =>
      toData(await api.GET("/design/study/{study_id}/structures/{rank}/plant", { params: { path }, signal })),
    enabled: open,
    retry: false,
  });
  const save = useMutation({
    mutationFn: async () =>
      toData(await api.POST("/design/study/{study_id}/structures/{rank}/plant", { params: { path } })),
    onSuccess: async (saved) => {
      toast(`Saved as plant v${String(saved.plant_version)}`);
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
    onError: (error) => {
      toast(isNotStored(error) ? notStored : error instanceof Error ? error.message : "The plant could not be saved");
    },
  });
  if (isNotStored(plant.error) || isNotStored(save.error)) {
    return (
      <span className="flex flex-col gap-1" title={notStored}>
        <Button size="sm" disabled aria-label={`Open rank ${String(row.rank)}: ${notStored}`}>
          Open
        </Button>
        <Button size="sm" disabled aria-label={`Save rank ${String(row.rank)}: ${notStored}`}>
          Save
        </Button>
      </span>
    );
  }
  return (
    <span className="flex flex-col gap-1">
      <Button
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </Button>
      <Button
        size="sm"
        variant="default"
        disabled={save.isPending}
        onClick={() => {
          save.mutate();
        }}
      >
        Save as plant
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Rank {row.rank}: {toStructureText(row.structure)}</DialogTitle>
            <DialogDescription>
              The plant of this structure with the parameters the search found. Save it to make it the
              project&apos;s next plant version.
            </DialogDescription>
          </DialogHeader>
          {plant.isPending ? <Notice status="loading" what="the plant" /> : null}
          {plant.isError ? <Notice status="failed" error={plant.error} /> : null}
          {plant.data === undefined ? null : (
            <pre className="max-h-[60vh] overflow-auto rounded-control bg-sunken p-2 font-mono text-[12px]">
              {JSON.stringify(plant.data.plant, null, 2)}
            </pre>
          )}
          {save.data === undefined ? null : (
            <Link className="text-accent" to={`/projects/${projectId}/design/plant`}>
              Open plant v{save.data.plant_version} on the Plant page
            </Link>
          )}
        </DialogContent>
      </Dialog>
    </span>
  );
}

function RankTable({
  data,
  chosen,
  onChoose,
}: {
  data: StudyStructures;
  chosen: number[];
  onChoose: (rank: number, on: boolean) => void;
}) {
  const metricKeys = toKeys(data.structures, (row) => row.metrics);
  const objectiveKeys = data.objectives.map((objective) => objective.replace(/^-/, ""));
  const shownMetrics = [...objectiveKeys.filter((key) => metricKeys.includes(key)), ...metricKeys.filter((key) => !objectiveKeys.includes(key))];
  const several = data.objectives.length > 1;
  return (
    <Card className={tableCardClass}>
      <Table className="[&_td]:p-2.5 [&_td]:align-top [&_td]:whitespace-normal [&_th]:p-2.5">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Compare</TableHead>
            <TableHead scope="col">Rank</TableHead>
            <TableHead scope="col">Structure</TableHead>
            <TableHead scope="col">Feasible</TableHead>
            {shownMetrics.map((key) => (
              <TableHead key={key} scope="col">
                {objectiveKeys.includes(key) ? toObjectiveName(data.objectives[objectiveKeys.indexOf(key)] ?? key) : toWords(key)}
              </TableHead>
            ))}
            <TableHead scope="col">Parameters</TableHead>
            <TableHead scope="col">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.structures.map((row) => {
            const on = chosen.includes(row.rank);
            return (
              <TableRow key={row.rank} data-state={on ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    aria-label={`Compare rank ${String(row.rank)}`}
                    checked={on}
                    disabled={!on && chosen.length >= compareMost}
                    onCheckedChange={(next) => {
                      onChoose(row.rank, next === true);
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {row.rank}
                  {several && row.on_front ? (
                    <Badge variant="info" className="ml-1.5">
                      front
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="min-w-[12rem]">{toStructureText(row.structure)}</TableCell>
                <TableCell>
                  <Feasible row={row} />
                </TableCell>
                {shownMetrics.map((key) => (
                  <TableCell key={key} className="tabular-nums">
                    {toValueText(row.metrics[key])}
                  </TableCell>
                ))}
                <TableCell className="min-w-[12rem] text-[12px] text-muted">
                  {Object.entries(row.parameters)
                    .map(([name, value]) => `${toWords(name)} ${toValueText(value)}`)
                    .join(" · ") || "–"}
                </TableCell>
                <TableCell>
                  <RowActions studyId={data.study} row={row} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function CompareTable({ rows }: { rows: StudyStructure[] }) {
  const lines: { group: string; key: string; values: string[] }[] = [
    { group: "", key: "Structure", values: rows.map((row) => toStructureText(row.structure)) },
    { group: "", key: "Feasible", values: rows.map((row) => (row.feasible ? "feasible" : `infeasible${row.reason ? `: ${row.reason}` : ""}`)) },
    ...toKeys(rows, (row) => row.metrics).map((key) => ({
      group: "Metrics",
      key: toWords(key),
      values: rows.map((row) => toValueText(row.metrics[key])),
    })),
    ...toKeys(rows, (row) => row.parameters).map((key) => ({
      group: "Parameters",
      key: toWords(key),
      values: rows.map((row) => toValueText(row.parameters[key])),
    })),
  ];
  return (
    <section aria-label="Side by side" className="space-y-2">
      <h2>Side by side</h2>
      <Card className={tableCardClass}>
        <Table className="[&_td]:p-2.5 [&_td]:align-top [&_td]:whitespace-normal [&_th]:p-2.5">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Value</TableHead>
              {rows.map((row) => (
                <TableHead key={row.rank} scope="col">
                  Rank {row.rank}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const differs = new Set(line.values).size > 1;
              return (
                <TableRow key={`${line.group}-${line.key}`}>
                  <TableHead scope="row" className="font-medium whitespace-normal">
                    {line.group === "" ? null : <span className="text-[11.5px] text-muted">{line.group} · </span>}
                    {line.key}
                  </TableHead>
                  {line.values.map((value, position) => (
                    <TableCell key={position} className={differs ? "bg-warn-soft font-medium" : "text-muted"}>
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <p className="text-[12px] text-muted">Highlighted rows differ between the chosen structures.</p>
    </section>
  );
}

/** The best unique structures of an evolve study, ranked, with 2 or 3 of them side by side. */
export function StructuresPage() {
  const projectId = useRequiredParam("projectId");
  const studyId = useRequiredParam("studyId");
  const query = useQuery(structuresQuery(studyId));
  const [chosen, setChosen] = useState<number[]>([]);
  const back = (
    <Link className="text-accent" to={`/projects/${projectId}/design/study`}>
      Back to the studies
    </Link>
  );
  if (query.isPending) {
    return (
      <>
        <PageHeader title="Compare structures" />
        <Notice status="loading" what="the structures" />
      </>
    );
  }
  if (query.isError) {
    return (
      <>
        <PageHeader title="Compare structures" />
        <Notice status="failed" error={query.error} />
        {back}
      </>
    );
  }
  const data = query.data;
  const rows = data.structures.filter((row) => chosen.includes(row.rank));
  return (
    <div className="space-y-4">
      <PageHeader
        title="Compare structures"
        description={`${data.name}: the best ${String(data.structures.length)} of ${String(data.total)} unique structures, feasible first, ranked by ${data.objectives.map(toObjectiveName).join(", ")}. Choose 2 or 3 to see them side by side.`}
        actions={back}
      />
      {data.structures.length === 0 ? (
        <Notice status="empty">This study found no valid structure.</Notice>
      ) : (
        <RankTable
          data={data}
          chosen={chosen}
          onChoose={(rank, on) => {
            setChosen((current) => (on ? [...current, rank].slice(-compareMost) : current.filter((item) => item !== rank)));
          }}
        />
      )}
      {rows.length >= 2 ? <CompareTable rows={rows} /> : null}
    </div>
  );
}
