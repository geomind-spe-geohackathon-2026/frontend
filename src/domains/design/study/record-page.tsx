import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Notice } from "@/shared/ui/notice";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { DataCell, DataHead, DataTable } from "@/shared/ui/data-table";
import {
  agentRecordQuery,
  asFields,
  asList,
  toCell,
  toRankedRows,
  toRecordSummary,
} from "./agent-record";

type Fields = Record<string, unknown>;

function toWords(name: string): string {
  const words = name.replaceAll("_", " ").replaceAll(".", " › ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function RunsTable({ runs }: { runs: Fields[] }) {
  const metricKeys = [...new Set(runs.flatMap((run) => Object.keys(asFields(run.metrics) ?? {})))];
  return (
    <DataTable
      caption="Runs of this study"
      className="max-h-[70vh]"
      head={
        <>
          <DataHead>Plant</DataHead>
          <DataHead>Design</DataHead>
          <DataHead>Verdict</DataHead>
          <DataHead>Why</DataHead>
          {metricKeys.map((key) => (
            <DataHead key={key}>{toWords(key)}</DataHead>
          ))}
          <DataHead>Note</DataHead>
        </>
      }
    >
      {runs.map((run, position) => {
        const metrics = asFields(run.metrics) ?? {};
        return (
          <TableRow key={position}>
            <DataCell className="font-medium">{toCell(run.plant_name ?? run.design)}</DataCell>
            <DataCell className="font-mono text-[11.5px] text-muted">
              {typeof run.design === "string" && run.plant_name !== undefined ? run.design : ""}
            </DataCell>
            <TableCell className="py-1.5">
              <Badge variant={run.feasible === true ? "ok" : "bad"}>
                {run.feasible === true ? "feasible" : "infeasible"}
              </Badge>
            </TableCell>
            <DataCell className="text-muted">
              {typeof run.verdict === "string" ? run.verdict : ""}
            </DataCell>
            {metricKeys.map((key) => (
              <DataCell key={key} className="tabular-nums">
                {toCell(metrics[key])}
              </DataCell>
            ))}
            <DataCell className="text-muted">{toCell(run.note ?? null)}</DataCell>
          </TableRow>
        );
      })}
    </DataTable>
  );
}

function ValuesTable({ values }: { values: Fields }) {
  return (
    <DataTable
      caption="Values"
      className="max-h-[70vh]"
      head={
        <>
          <DataHead>Name</DataHead>
          <DataHead>Value</DataHead>
        </>
      }
    >
      {Object.entries(values).map(([key, value]) => (
        <TableRow key={key}>
          <DataCell className="font-medium">{toWords(key)}</DataCell>
          <DataCell className="tabular-nums">{toCell(value)}</DataCell>
        </TableRow>
      ))}
    </DataTable>
  );
}

function toFeasible(row: Fields): string {
  if (row.feasible_low === undefined && row.feasible_high === undefined) return "";
  if (row.feasible_low === true && row.feasible_high === true) return "both";
  if (row.feasible_low === false && row.feasible_high === false) return "neither";
  return row.feasible_low === true ? "low only" : "high only";
}

function SensitivityTable({ rows }: { rows: Fields[] }) {
  return (
    <DataTable
      caption="Uncertain values ranked by their swing of each result, largest first"
      className="max-h-[70vh]"
      head={
        <>
          <DataHead>Rank</DataHead>
          <DataHead>Value</DataHead>
          <DataHead>Low</DataHead>
          <DataHead>High</DataHead>
          <DataHead>Result</DataHead>
          <DataHead>At low</DataHead>
          <DataHead>At high</DataHead>
          <DataHead>Swing</DataHead>
          <DataHead>Feasible</DataHead>
        </>
      }
    >
      {toRankedRows(rows).map((row, position, ranked) => {
        const rank = ranked
          .slice(0, position + 1)
          .filter((item) => item.metric === row.metric).length;
        return (
          <TableRow key={`${String(row.parameter)}-${String(row.metric)}`}>
            <DataCell className="tabular-nums text-muted">{rank}</DataCell>
            <DataCell className="font-medium">
              {toWords(String(row.parameter).replace(/^case\./, ""))}
            </DataCell>
            <DataCell className="tabular-nums">{toCell(row.low)}</DataCell>
            <DataCell className="tabular-nums">{toCell(row.high)}</DataCell>
            <DataCell>{toWords(String(row.metric))}</DataCell>
            <DataCell className="tabular-nums">{toCell(row.at_low)}</DataCell>
            <DataCell className="tabular-nums">{toCell(row.at_high)}</DataCell>
            <DataCell className="font-medium tabular-nums">{toCell(row.effect)}</DataCell>
            <DataCell className="text-muted">{toFeasible(row)}</DataCell>
          </TableRow>
        );
      })}
    </DataTable>
  );
}

function RawRecord({ result }: { result: unknown }) {
  return (
    <details className="text-[12.5px] text-muted">
      <summary className="cursor-pointer">Raw record (JSON)</summary>
      <pre className="mt-1 max-h-[60vh] overflow-auto rounded-control bg-sunken p-2 font-mono text-[12px]">
        {JSON.stringify(result, null, 2)}
      </pre>
    </details>
  );
}

function RecordBody({ result }: { result: unknown }) {
  const fields = asFields(result);
  if (fields === null) return <p className="text-muted">The study stored no result.</p>;
  const runs = asList(fields.runs);
  if (runs.length > 0) return <RunsTable runs={runs} />;
  const rows = asList(fields.rows);
  if (rows.length > 0) {
    return (
      <div className="space-y-2">
        <SensitivityTable rows={rows} />
        <RawRecord result={result} />
      </div>
    );
  }
  const sizing = asFields(fields.sizing);
  if (sizing !== null) return <ValuesTable values={sizing} />;
  if ("best" in fields) {
    const best = asFields(fields.best);
    const trials = Array.isArray(fields.trials) ? fields.trials.length : null;
    return (
      <div className="space-y-2">
        <ValuesTable values={best ?? { best: fields.best }} />
        <p className="text-[12.5px] text-muted">
          {fields.feasible === false ? "The best design is not feasible. " : ""}
          {trials === null ? "" : `${String(trials)} trials.`}
        </p>
      </div>
    );
  }
  return (
    <pre className="max-h-[60vh] overflow-auto rounded-control bg-sunken p-2 font-mono text-[12px]">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

/** What an assistant's study call stored: its runs with verdict and metrics, its sizing, or its best design. */
export function RecordPage() {
  const projectId = useRequiredParam("projectId");
  const studyId = useRequiredParam("studyId");
  const record = useQuery(agentRecordQuery(studyId));
  const back = (
    <Link className="text-accent" to={`/projects/${projectId}/design/study`}>
      Back to the studies
    </Link>
  );
  if (record.isPending) return <Notice status="loading" what="the study record" />;
  if (record.isError) {
    return (
      <>
        <PageHeader title="Study record" actions={back} />
        <Notice status="failed" error={record.error} />
      </>
    );
  }
  const { name, tool, method, designs, result } = record.data;
  return (
    <div className="space-y-4">
      <PageHeader
        title={name}
        description={`${toWords(tool)}${method === "" ? "" : ` · ${method}`} · ${toRecordSummary(tool, result)}`}
        actions={back}
      />
      <RecordBody result={result} />
      <p className="text-[12px] text-muted">
        Designs read: {toCell(designs.read)} · written: {toCell(designs.wrote)}
      </p>
    </div>
  );
}
