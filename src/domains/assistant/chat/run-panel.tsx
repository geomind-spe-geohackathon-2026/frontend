import { Chip } from "@/shared/ui/chip";
import { useQuery } from "@tanstack/react-query";
import { projectQuery } from "@/shared/api/projects";
import { toFailedCount } from "./blocks";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toShortId } from "@/lib/shortid";
import type { Run } from "@/shared/api/types";
import { RunStatusChip } from "@/shared/sse/status-chip";
import { UsageLine } from "@/shared/sse/usage-line";
import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import { toDepth, toLabel } from "./agents";
import { ProblemView } from "./problem";
import type { View } from "./view";

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
  if (agents.length === 0) return <p className="text-muted">No agent has started.</p>;
  return (
    <ul className="space-y-0.5 font-mono text-[12.5px]">
      {agents.map((agent) => (
        <li key={agent.path} style={{ paddingLeft: `${String(toDepth(agent.path) * 12)}px` }}>
          {toLabel(agent.path)} <span className="text-muted">· {agent.state}</span>
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
    <div className="space-y-3">
      <Card>
        <CardBody className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted">Assistant</span>
            {status === "done" && failed > 0 ? (
              <Chip tone="warn">
                done with {failed} {failed === 1 ? "error" : "errors"}
              </Chip>
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
                <UsageLine usage={view.usage} />
              </p>
              <AgentTree view={view} />
            </div>
          </details>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2>What it knows</h2>
        </CardHeader>
        <CardBody>
          <ProblemView document={view.problem.document} project={project.data} />
        </CardBody>
      </Card>
      <Link
        to={`/projects/${projectId}/assistant/runs/${runId}`}
        className="block rounded-card border border-border bg-surface px-3 py-2 text-center"
      >
        Open full log
      </Link>
    </div>
  );
}
