import { useQuery } from "@tanstack/react-query";
import { formatDuration, Tokens } from "@/shared/quantity/usage";
import { Quantity } from "@/shared/quantity/quantity";
import { toAgentName } from "@/shared/sse/agent-names";
import { runQuery } from "./api";

type Instance = {
  key: string;
  title: string;
  depth: number;
  steps: number;
  tokens: number;
  cost: number;
  seconds: number | null;
};

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toSeconds(started: unknown, ended: unknown): number | null {
  if (typeof started !== "string" || typeof ended !== "string") return null;
  const seconds = (Date.parse(ended) - Date.parse(started)) / 1000;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function toFields(value: unknown): Map<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? new Map(Object.entries(value))
    : new Map<string, unknown>();
}

function toInstances(run: unknown): Instance[] {
  const rows = toFields(run).get("instances");
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((item: unknown, position) => {
    const row = toFields(item);
    const agent = row.get("agent");
    if (typeof agent !== "string" || agent === "") return [];
    const named = row.get("instance");
    const instance = typeof named === "string" ? named : "";
    const field = (name: string): unknown => row.get(name);
    return [
      {
        key: `${agent}|${instance}|${String(position)}`,
        title: instance === "" ? toAgentName(agent) : instance,
        depth: agent.split(".").length - 1,
        steps: toNumber(field("steps")),
        tokens: toNumber(field("input_tokens")) + toNumber(field("output_tokens")),
        cost: toNumber(field("cost")),
        seconds: toSeconds(field("started"), field("ended")),
      },
    ];
  });
}

function toStepCount(steps: number): string {
  return `${String(steps)} ${steps === 1 ? "step" : "steps"}`;
}

function SummaryRow({ row }: { row: Instance }) {
  return (
    <li
      className="flex min-w-0 items-center gap-1.5"
      style={{ paddingLeft: `${String(row.depth * 12)}px` }}
    >
      <span aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="shrink-0 font-medium text-foreground">{row.title}</span>
      <span className="min-w-0 truncate">· done</span>
      <span className="shrink-0 tabular-nums">· {toStepCount(row.steps)}</span>
      <span className="shrink-0">
        · <Tokens value={row.tokens} unit="tokens" />
      </span>
      <span className="shrink-0">
        · <Quantity value={row.cost} unit="USD" fractionDigits={3} />
      </span>
      {row.seconds === null ? null : (
        <span className="shrink-0 tabular-nums">· {formatDuration(row.seconds)}</span>
      )}
    </li>
  );
}

/** The frozen busy list of an earlier finished run, from the run's stored per-agent totals (QA-341); nothing while the backend has none. */
export function RunSummary({ projectId, runId }: { projectId: string; runId: string }) {
  const run = useQuery({ ...runQuery(projectId, runId), staleTime: Number.POSITIVE_INFINITY });
  const rows = toInstances(run.data);
  if (rows.length === 0) return null;
  const data = toFields(run.data);
  const total: Instance = {
    key: "total",
    title: "Total",
    depth: 0,
    steps: rows.reduce((sum, row) => sum + row.steps, 0),
    tokens: rows.reduce((sum, row) => sum + row.tokens, 0),
    cost: rows.reduce((sum, row) => sum + row.cost, 0),
    seconds: toSeconds(data.get("started"), data.get("ended")),
  };
  return (
    <details className="text-[12.5px] text-muted">
      <summary className="cursor-pointer text-[12px]">
        {rows.length} {rows.length === 1 ? "agent" : "agents"}
      </summary>
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <SummaryRow key={row.key} row={row} />
        ))}
        <SummaryRow row={total} />
      </ul>
    </details>
  );
}
