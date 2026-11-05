import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { agentRecordQuery, toRecordSummary } from "./agent-record";
import { ProgressBar } from "@/shared/charts/progress-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
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
  onRunAgain: (study: Study) => void;
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

function AgentOutcome({ study, projectId, run }: { study: Study; projectId: string; run: string }) {
  const record = useQuery(agentRecordQuery(study.id));
  return (
    <div className="flex flex-col gap-0.5">
      {record.data === undefined ? null : (
        <>
          <span>{toRecordSummary(record.data.tool, record.data.result)}</span>
          <Link
            to={`/projects/${projectId}/design/study/${study.id}/record`}
            className="text-accent"
          >
            Open record
          </Link>
        </>
      )}
      <Link
        to={`/projects/${projectId}/assistant/runs/${run}`}
        className="text-[12px] text-muted underline"
      >
        Open run
      </Link>
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
    return <AgentOutcome study={study} projectId={projectId} run={study.started_by.run} />;
  }
  if (study.status === "blocked") {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <details>
          <summary className="cursor-pointer text-warn">
            Waits for {study.missing.length} {study.missing.length === 1 ? "value" : "values"}
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

type ActionsProps = Omit<Props, "onStart"> & { active: boolean };

function StudyActions({ study, projectId, busy, active, onCancel, onRunAgain }: ActionsProps) {
  const structures = study.kind === "evolve" && study.status === "done";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${study.name}`}
          title="Actions"
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {structures ? (
          <DropdownMenuItem asChild>
            <a
              href={`/projects/${projectId}/design/study/${study.id}/structures`}
              target="_blank"
              rel="noreferrer"
            >
              Compare structures
            </a>
          </DropdownMenuItem>
        ) : null}
        {active ? (
          <DropdownMenuItem
            variant="destructive"
            disabled={busy}
            onSelect={() => {
              onCancel(study.id);
            }}
          >
            Cancel
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              onRunAgain(study);
            }}
          >
            Run again
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** One study row: kind, who started it, status, progress, and its result link or what is missing. */
export function StudyRow({ study, projectId, busy, onStart, onCancel, onRunAgain }: Props) {
  const active = study.status === "queued" || study.status === "running";
  return (
    <TableRow>
      <TableHead
        scope="row"
        title={study.name}
        className="text-left font-medium whitespace-normal [overflow-wrap:anywhere]"
      >
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
      <TableCell className="min-w-[7rem] [overflow-wrap:anywhere]">
        <OutcomeCell study={study} projectId={projectId} />
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        {study.status === "blocked" ? (
          <Button
            size="sm"
            aria-label={`Start ${study.name}`}
            disabled={busy}
            onClick={() => {
              onStart(study.id);
            }}
          >
            Start
          </Button>
        ) : null}
        <StudyActions {...{ study, projectId, busy, active, onCancel, onRunAgain }} />
      </TableCell>
    </TableRow>
  );
}
