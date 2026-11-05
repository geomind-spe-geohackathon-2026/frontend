import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Notice } from "@/shared/ui/notice";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tableCardClass } from "@/shared/ui/table-card";
import { agentRecordQuery, asFields, asList, toCell, toRecordSummary } from "./agent-record";

type Fields = Record<string, unknown>;

const tableClass = "[&_td]:p-2.5 [&_td]:align-top [&_td]:whitespace-normal [&_th]:p-2.5";

function toWords(name: string): string {
  const words = name.replaceAll("_", " ").replaceAll(".", " › ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function RunsTable({ runs }: { runs: Fields[] }) {
  const metricKeys = [...new Set(runs.flatMap((run) => Object.keys(asFields(run.metrics) ?? {})))];
  return (
    <Card className={tableCardClass}>
      <Table className={tableClass}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Plant</TableHead>
            <TableHead scope="col">Verdict</TableHead>
            {metricKeys.map((key) => (
              <TableHead key={key} scope="col">
                {toWords(key)}
              </TableHead>
            ))}
            <TableHead scope="col">Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run, position) => {
            const metrics = asFields(run.metrics) ?? {};
            return (
              <TableRow key={position}>
                <TableHead scope="row" className="font-medium whitespace-normal">
                  {toCell(run.plant_name ?? run.design)}
                  {typeof run.design === "string" && run.plant_name !== undefined ? (
                    <span className="block font-mono text-[11.5px] text-muted">{run.design}</span>
                  ) : null}
                </TableHead>
                <TableCell>
                  <Badge variant={run.feasible === true ? "ok" : "bad"}>
                    {run.feasible === true ? "feasible" : "infeasible"}
                  </Badge>
                  {typeof run.verdict === "string" ? (
                    <span className="mt-0.5 block text-[12px] text-muted">{run.verdict}</span>
                  ) : null}
                </TableCell>
                {metricKeys.map((key) => (
                  <TableCell key={key} className="tabular-nums">
                    {toCell(metrics[key])}
                  </TableCell>
                ))}
                <TableCell className="text-[12px] text-muted">{toCell(run.note ?? null)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function ValuesTable({ values }: { values: Fields }) {
  return (
    <Card className={tableCardClass}>
      <Table className={tableClass}>
        <TableBody>
          {Object.entries(values).map(([key, value]) => (
            <TableRow key={key}>
              <TableHead scope="row" className="font-medium whitespace-normal">
                {toWords(key)}
              </TableHead>
              <TableCell className="tabular-nums [overflow-wrap:anywhere]">{toCell(value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function RecordBody({ result }: { result: unknown }) {
  const fields = asFields(result);
  if (fields === null) return <p className="text-muted">The study stored no result.</p>;
  const runs = asList(fields.runs);
  if (runs.length > 0) return <RunsTable runs={runs} />;
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
