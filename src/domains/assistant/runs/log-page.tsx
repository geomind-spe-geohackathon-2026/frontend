import { Duration, Tokens } from "@/shared/quantity/usage";
import { toAgentName } from "@/shared/sse/agent-names";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { toShortId } from "@/lib/shortid";
import { useRequiredParam } from "@/shared/layout/params";
import { PageHeader } from "@/shared/layout/page-header";
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

type AgentNode = { path: string; positions: number[]; children: AgentNode[] };

function toTree(steps: LogStep[]): AgentNode[] {
  const nodes = new Map<string, AgentNode>();
  const roots: AgentNode[] = [];
  const nodeOf = (path: string): AgentNode => {
    const known = nodes.get(path);
    if (known !== undefined) return known;
    const node: AgentNode = { path, positions: [], children: [] };
    nodes.set(path, node);
    const cut = path.lastIndexOf(".");
    if (cut < 0) roots.push(node);
    else nodeOf(path.slice(0, cut)).children.push(node);
    return node;
  };
  steps.forEach((step, position) => {
    nodeOf(step.agent).positions.push(position);
  });
  return roots;
}

function toNodeTokens(node: AgentNode, steps: LogStep[]): number {
  const own = node.positions.reduce((sum, position) => sum + toStepTokens(steps[position] as LogStep), 0);
  return node.children.reduce((sum, child) => sum + toNodeTokens(child, steps), own);
}

function hasSelected(node: AgentNode, selected: number): boolean {
  return node.positions.includes(selected) || node.children.some((child) => hasSelected(child, selected));
}

const rowClass = "flex w-full items-center justify-between gap-2 rounded-control px-2 py-1 text-left whitespace-nowrap";

function AgentBranch({ node, steps, selected, onSelect }: StepListProps & { node: AgentNode }) {
  const count = node.positions.length;
  return (
    <li>
      <details open={hasSelected(node, selected)}>
        <summary className={`${rowClass} cursor-pointer font-medium`}>
          <span className="min-w-0 truncate">{toAgentName(node.path)}</span>
          <span className="shrink-0 text-[11.5px] font-normal text-muted tabular-nums">
            {count} {count === 1 ? "step" : "steps"} ·{" "}
            <Tokens value={toNodeTokens(node, steps)} />
          </span>
        </summary>
        <ul className="ml-2 space-y-0.5 border-l border-border pl-1.5">
          {node.positions.map((position) => {
            const step = steps[position] as LogStep;
            return (
              <li key={position}>
                <button
                  type="button"
                  aria-current={position === selected ? "step" : undefined}
                  onClick={() => {
                    onSelect(position);
                  }}
                  className={`${rowClass} ${position === selected ? "bg-accent-soft" : ""}`}
                >
                  <span>Step {step.index}</span>
                  <Tokens value={toStepTokens(step)} className="text-muted" />
                </button>
              </li>
            );
          })}
          {node.children.map((child) => (
            <AgentBranch key={child.path} node={child} steps={steps} selected={selected} onSelect={onSelect} />
          ))}
        </ul>
      </details>
    </li>
  );
}

function StepList({ steps, selected, onSelect }: StepListProps) {
  return (
    <nav
      aria-label="Steps"
      className="max-h-[calc(100dvh-12rem)] self-start overflow-y-auto rounded-card border border-border bg-surface p-1.5 text-[12.5px] lg:sticky lg:top-3"
    >
      <ul className="space-y-0.5">
        {toTree(steps).map((node) => (
          <AgentBranch key={node.path} node={node} steps={steps} selected={selected} onSelect={onSelect} />
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
        {seconds === null ? null : <Duration seconds={seconds} />}
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
        <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-3 max-[760px]:grid-cols-1">
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
