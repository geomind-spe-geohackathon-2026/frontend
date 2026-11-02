import { Link } from "react-router-dom";
import { ProgressBar } from "@/shared/charts/progress-bar";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Missing } from "@/shared/quantity/missing";
import { toProgress } from "./progress";
import type { Study, StudyStatus } from "@/shared/api/types";

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

function ProgressCell({ study }: { study: Study }) {
  const progress = toProgress(study);
  if (progress.kind === "none") return <span className="text-muted">-</span>;
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
      <div className="flex flex-col gap-1">
        {study.missing.map((entry) => (
          <Missing key={entry.path} blocks={`${entry.path}: ${entry.message}`} />
        ))}
        <Link to={`${base}/case`} className="text-accent">
          Fill it in on Problem
        </Link>
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
    <tr>
      <th scope="row" className="text-left font-medium">
        {study.name}
      </th>
      <td>{study.kind}</td>
      <td>
        {study.started_by.kind === "agent" ? "Agent" : "User"} {study.started_by.name}
      </td>
      <td>
        <ProgressCell study={study} />
      </td>
      <td>
        <Chip tone={tones[study.status]}>{study.status}</Chip>
      </td>
      <td>
        <OutcomeCell study={study} projectId={projectId} />
      </td>
      <td>
        {study.status === "blocked" ? (
          <Button
            disabled={busy}
            onClick={() => {
              onStart(study.id);
            }}
          >
            Start {study.name}
          </Button>
        ) : null}
        {active ? (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              onCancel(study.id);
            }}
          >
            Cancel {study.name}
          </Button>
        ) : null}
      </td>
    </tr>
  );
}
