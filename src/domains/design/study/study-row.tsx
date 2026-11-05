import { Link } from "react-router-dom";
import { ProgressBar } from "@/shared/charts/progress-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toProgress } from "./progress";
import { wideColumnClass } from "./columns";
import type { Study, StudyStatus } from "@/shared/api/types";
import { TableRow, TableHead, TableCell } from "@/components/ui/table";

type Props = {
  study: Study;
  projectId: string;
  busy: boolean;
  onStart: (studyId: string) => void;
  onCancel: (studyId: string) => void;
};

type Tone = "ok" | "warn" | "bad" | "info" | "off";

const tones: Record<StudyStatus, Tone> = {
  queued: "off",
  running: "info",
  done: "ok",
  failed: "bad",
  cancelled: "off",
  blocked: "warn",
};

const kindLabels: Record<string, string> = {
  size: "Run the design",
  minimize: "Best design",
  sample: "Uncertainty",
  sensitivity: "What matters most",
  evolve: "Find the best structure",
};

function ProgressCell({ study }: { study: Study }) {
  const progress = toProgress(study);
  if (progress.kind === "none" || study.status === "done")
    return <span className="text-muted">-</span>;
  const value = progress.kind === "determinate" ? progress.done : null;
  const max = progress.kind === "determinate" ? progress.total : 1;
  return (
    <div className="flex flex-col gap-1">
      <ProgressBar value={value} max={max} label={`Progress of ${study.name}`} />
      <span className="text-[12px] text-muted">{progress.text}</span>
    </div>
  );
}

function OutcomeCell({ study, projectId }: { study: Study; projectId: string }) {
  const base = `/projects/${projectId}/design`;
  if (study.status === "done" && study.result !== null) {
    return (
      <Link to={`${base}/results/${study.result}`} className="text-accent">
        Open result
      </Link>
    );
  }
  if (study.status === "done" && study.started_by.run !== null) {
    return (
      <Link
        to={`/projects/${projectId}/assistant/runs/${study.started_by.run}`}
        className="text-accent"
      >
        Open run
      </Link>
    );
  }
  if (study.status === "blocked") {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <details>
          <summary className="cursor-pointer text-warn">
            Waits for {study.missing.length}{" "}
            {study.missing.length === 1 ? "value" : "values"}
          </summary>
          <ul className="mt-1 list-none p-0 font-mono text-[12px] [overflow-wrap:anywhere]">
            {study.missing.map((entry) => (
              <li key={entry.path} title={entry.message}>
                {entry.path}
              </li>
            ))}
          </ul>
        </details>
        {study.missing.some((entry) => !entry.path.startsWith("params.")) ? (
          <Link to={`${base}/case`} className="text-accent">
            Fill them in on Case
          </Link>
        ) : null}
        {study.missing.some((entry) => entry.path.startsWith("params.")) ? (
          <Link to={`${base}/plant`} className="text-accent">
            Fill them in on Plant
          </Link>
        ) : null}
      </div>
    );
  }
  if (study.status === "failed" && study.error !== null) {
    return (
      <span className="text-bad">
        {study.error.code}: {study.error.message}
      </span>
    );
  }
  return <span className="text-muted">-</span>;
}

/** One study row: kind, who started it, status, progress, and its result link or what is missing. */
export function StudyRow({ study, projectId, busy, onStart, onCancel }: Props) {
  const active = study.status === "queued" || study.status === "running";
  return (
    <TableRow>
      <TableHead scope="row" className="text-left font-medium whitespace-normal">
        {study.name}
      </TableHead>
      <TableCell className={wideColumnClass}>{kindLabels[study.kind] ?? study.kind}</TableCell>
      <TableCell className={wideColumnClass}>{study.started_by.name}</TableCell>
      <TableCell>
        <ProgressCell study={study} />
      </TableCell>
      <TableCell>
        <Badge variant={tones[study.status]}>{study.status}</Badge>
      </TableCell>
      <TableCell className="min-w-[9rem] [overflow-wrap:anywhere]">
        <OutcomeCell study={study} projectId={projectId} />
      </TableCell>
      <TableCell>
        {study.kind === "evolve" && study.status === "done" ? (
          <a
            className="text-accent"
            href={`/projects/${projectId}/design/study/${study.id}/structures`}
            target="_blank"
            rel="noreferrer"
          >
            Compare structures
          </a>
        ) : null}
        {study.status === "blocked" ? (
          <Button
            aria-label={`Start ${study.name}`}
            disabled={busy}
            onClick={() => {
              onStart(study.id);
            }}
          >
            Start
          </Button>
        ) : null}
        {active ? (
          <Button
            aria-label={`Cancel ${study.name}`}
            variant="destructive"
            disabled={busy}
            onClick={() => {
              onCancel(study.id);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
