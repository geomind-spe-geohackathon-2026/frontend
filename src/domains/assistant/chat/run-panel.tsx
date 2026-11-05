import { AlternativesTable } from "./alternatives-table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { projectQuery } from "@/shared/api/projects";
import { toFailedCount } from "./blocks";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toShortId } from "@/lib/shortid";
import type { Run } from "@/shared/api/types";
import { RunStatusChip } from "@/shared/sse/status-chip";
import { UsageLine } from "@/shared/sse/usage-line";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toDepth } from "./agents";
import { toAgentName } from "@/shared/sse/agent-names";
import { ProblemView } from "./problem";
import { BusyMark, toWorkingAgents } from "./busy";
import { toRunUsage, type View } from "./view";

type Props = { projectId: string; runId: string; view: View; run: Run | undefined };

function toClock(seconds: number): string {
  const whole = Math.floor(seconds);
  const minutes = String(Math.floor(whole / 60)).padStart(2, "0");
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

function Elapsed({ run, active }: { run: Run; active: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [active]);
  if (run.started === null) return <span className="tabular-nums">{toClock(0)}</span>;
  const end = active || run.ended === null ? now : Date.parse(run.ended);
  return (
    <span className="tabular-nums">
      {toClock(Math.max(0, end - Date.parse(run.started)) / 1000)}
    </span>
  );
}

function AgentTree({ view }: { view: View }) {
  const agents = Object.values(view.agents);
  const working = toWorkingAgents(view);
  if (agents.length === 0) return <p className="text-muted">No agent has started.</p>;
  return (
    <ul className="space-y-0.5 font-mono text-[12.5px]">
      {agents.map((agent) => (
        <li
          key={agent.path}
          className="flex items-center gap-1.5"
          style={{ paddingLeft: `${String(toDepth(agent.path) * 12)}px` }}
        >
          {working.includes(agent.path) ? <BusyMark /> : <span className="size-3.5 shrink-0" />}
          {toAgentName(agent.path)} <span className="text-muted">· {agent.state}</span>
        </li>
      ))}
    </ul>
  );
}

/** The right column of the chat: status and timer, what it knows, the log; tokens and agents behind Details. */
export function RunPanel({ projectId, runId, view, run }: Props) {
  const status = view.blocks.length === 0 && run !== undefined ? run.status : view.status;
  const active = status === "queued" || status === "running" || status === "waiting";
  const failed = toFailedCount(view.blocks);
  const project = useQuery(projectQuery(projectId));
  return (
    <div className="min-w-0 space-y-3">
      <Card>
        <CardContent className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted">Assistant</span>
            {status === "done" && failed > 0 ? (
              <Badge variant="warn">
                done with {failed} {failed === 1 ? "error" : "errors"}
              </Badge>
            ) : (
              <RunStatusChip status={status} />
            )}
          </div>
          {run === undefined ? null : (
            <p>
              Time <Elapsed run={run} active={active} />
            </p>
          )}
          <details>
            <summary className="cursor-pointer text-muted">Details</summary>
            <div className="mt-1.5 space-y-1.5">
              <p className="text-muted">Run {toShortId(runId)}</p>
              <p>
                <UsageLine usage={toRunUsage(view)} />
              </p>
              <AgentTree view={view} />
            </div>
          </details>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2>What it knows</h2>
        </CardHeader>
        <CardContent>
          <ProblemView document={view.problem.document} project={project.data} />
        </CardContent>
      </Card>
      <AlternativesTable document={view.problem.document} projectId={projectId} />
      <Link
        to={`/projects/${projectId}/assistant/runs/${runId}`}
        className="block rounded-card border border-border bg-surface px-3 py-2 text-center"
      >
        Open full log
      </Link>
    </div>
  );
}
