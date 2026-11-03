import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { toShortId } from "@/lib/shortid";
import { useRequiredParam } from "@/shared/layout/params";
import { PageHeader } from "@/shared/layout/page-header";
import { Quantity } from "@/shared/quantity/quantity";
import type { Run } from "@/shared/api/types";
import type { LogStep } from "@/shared/sse/runlog";
import { ErrorNotice } from "@/shared/sse/notice";
import { RunStatusChip } from "@/shared/sse/status-chip";
import { UsageLine } from "@/shared/sse/usage-line";
import { Button } from "@/components/ui/button";
import { downloadLog, runLogQuery } from "./api";
import { StepDetail } from "./step-detail";
import { toStepTokens, toTotals } from "./totals";
import { TotalsTable } from "./totals-table";
import { Notice } from "@/shared/ui/notice";

type StepListProps = { steps: LogStep[]; selected: number; onSelect: (position: number) => void };

function StepList({ steps, selected, onSelect }: StepListProps) {
  return (
    <nav aria-label="Steps" className="rounded-card border border-border bg-surface p-1.5">
      <ul className="space-y-0.5">
        {steps.map((step, position) => (
          <li key={`${step.agent}/${String(step.index)}/${String(position)}`}>
            <button
              type="button"
              aria-current={position === selected ? "step" : undefined}
              onClick={() => {
                onSelect(position);
              }}
              className={`flex w-full justify-between gap-2 rounded-control px-2 py-1.5 text-left ${position === selected ? "bg-accent-soft" : ""}`}
              style={{ paddingLeft: `${String(8 + 12 * (step.agent.split(".").length - 1))}px` }}
            >
              <span>
                {step.agent} · step {step.index}
              </span>
              <Quantity
                value={toStepTokens(step)}
                unit=""
                fractionDigits={0}
                className="text-muted"
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function toSeconds(started: string | null, ended: string | null): number | null {
  return started === null || ended === null
    ? null
    : (Date.parse(ended) - Date.parse(started)) / 1000;
}

function LogHeader({ projectId, run }: { projectId: string; run: Run }) {
  const seconds = toSeconds(run.started, run.ended);
  return (
    <>
      <Link className="text-accent" to={`/projects/${projectId}/assistant/runs`}>
        All runs
      </Link>
      <PageHeader
        title={`Run ${toShortId(run.id)}`}
        actions={
          <>
            <Button
              onClick={() => {
                void downloadLog(run.id, "json");
              }}
            >
              Export JSON
            </Button>
            <Button
              onClick={() => {
                void downloadLog(run.id, "md");
              }}
            >
              Export Markdown
            </Button>
          </>
        }
      />
      <p className="mb-3 flex flex-wrap items-center gap-2 text-muted">
        <RunStatusChip status={run.status} />
        {seconds === null ? null : <Quantity value={seconds} unit="s" fractionDigits={0} />}
        <UsageLine usage={run.usage} />
      </p>
    </>
  );
}

function toSelected(search: URLSearchParams, count: number): number {
  const requested = Number(search.get("step") ?? "0");
  return Number.isInteger(requested) && requested >= 0 && requested < count ? requested : 0;
}

/** The full log of one run: steps by agent on the left, the selected step on the right, totals below. */
export function RunLogPage() {
  const projectId = useRequiredParam("projectId");
  const runId = useRequiredParam("runId");
  const [search, setSearch] = useSearchParams();
  const log = useQuery(runLogQuery(projectId, runId));

  if (!log.isSuccess) {
    return (
      <>
        <PageHeader title="Run log" />
        {log.isError ? (
          <ErrorNotice error={log.error} what="The run log" />
        ) : (
          <Notice status="loading" what="the log" />
        )}
      </>
    );
  }

  const { run, steps } = log.data;
  const selected = toSelected(search, steps.length);
  const step = steps[selected];
  const totals = toTotals(steps);

  return (
    <>
      <LogHeader projectId={projectId} run={run} />
      {step === undefined ? (
        <p className="text-muted">This run has no recorded steps.</p>
      ) : (
        <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-3 max-[1000px]:grid-cols-1">
          <StepList
            steps={steps}
            selected={selected}
            onSelect={(position) => {
              setSearch({ step: String(position) });
            }}
          />
          <div className="space-y-3">
            <StepDetail step={step} />
            <TotalsTable caption="Per agent" label="Agent" rows={totals.agents} />
            <TotalsTable caption="Per model" label="Model" rows={totals.models} />
          </div>
        </div>
      )}
    </>
  );
}
