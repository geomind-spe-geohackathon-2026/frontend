import type { RunStatus } from "@/shared/api/types";
import { toBestValue } from "@/shared/sse/pretty";
import type { RunEvent, RunRequest, Usage } from "@/shared/sse/types";
import { applyChanges } from "./patch";

export type Block =
  | { kind: "text"; id: string; agent: string; text: string; open: boolean; settled: number }
  | {
      kind: "tool";
      id: string;
      agent: string;
      tool: string;
      input: unknown;
      state: "running" | "done" | "failed";
      summary: string;
      duration: number | null;
      error: string | null;
    }
  | { kind: "request"; id: string; agent: string; request: RunRequest; resolved: boolean }
  | {
      kind: "end";
      id: string;
      agent: string;
      status: RunStatus;
      message: string | null;
      reason: string;
      studies: RecordedStudy[];
    };

export type RecordedStudy = { id: string; name: string; best: string | null };

export type AgentNode = {
  path: string;
  parent: string | null;
  state: "running" | "done";
  steps: number;
  tools: number;
};

export type ProblemState = { version: number; document: unknown };

export type View = {
  status: RunStatus;
  loop: string | null;
  blocks: Block[];
  agents: Record<string, AgentNode>;
  openSteps: Record<string, string>;
  usage: Usage;
  request: RunRequest | null;
  problem: ProblemState;
  problemStale: boolean;
  studies: RecordedStudy[];
};

/** The view before any event: nothing has happened yet. */
export const emptyView: View = {
  status: "queued",
  loop: null,
  blocks: [],
  agents: {},
  openSteps: {},
  usage: { input_tokens: 0, output_tokens: 0, cost: 0 },
  request: null,
  problem: { version: 0, document: null },
  problemStale: false,
  studies: [],
};

function toStepKey(agent: string, index: number): string {
  return `${agent}#${String(index)}`;
}

function toParentPath(path: string): string | null {
  const cut = path.lastIndexOf(".");
  return cut < 0 ? null : path.slice(0, cut);
}

function touchAgent(view: View, event: RunEvent): View {
  const known = view.agents[event.agent];
  const base: AgentNode = known ?? {
    path: event.agent,
    parent: toParentPath(event.agent),
    state: "running",
    steps: 0,
    tools: 0,
  };
  const steps = base.steps + (event.type === "step.started" ? 1 : 0);
  const tools = base.tools + (event.type === "tool.started" ? 1 : 0);
  const finished = event.type === "run.finished" && event.parent !== null;
  const node: AgentNode = { ...base, steps, tools, state: finished ? "done" : base.state };
  return { ...view, agents: { ...view.agents, [event.agent]: node } };
}

function nextId(view: View): string {
  return `b${String(view.blocks.length)}`;
}

function addBlock(view: View, block: Block): View {
  return { ...view, blocks: [...view.blocks, block] };
}

function changeBlock(view: View, id: string, change: (block: Block) => Block): View {
  return { ...view, blocks: view.blocks.map((block) => (block.id === id ? change(block) : block)) };
}

function changeText(view: View, event: RunEvent & { type: "text.delta" }): View {
  const key = toStepKey(event.agent, event.index);
  const id = view.openSteps[key];
  if (id === undefined) return view;
  return changeBlock(view, id, (block) => {
    if (block.kind !== "text") return block;
    if (event.buffered === true) {
      return { ...block, text: event.text, settled: event.text.length };
    }
    return { ...block, text: block.text + event.text };
  });
}

function startStep(view: View, event: RunEvent & { type: "step.started" }): View {
  const id = nextId(view);
  const block: Block = { kind: "text", id, agent: event.agent, text: "", open: true, settled: 0 };
  const next = addBlock(view, block);
  const key = toStepKey(event.agent, event.index);
  return { ...next, openSteps: { ...next.openSteps, [key]: id } };
}

function finishStep(view: View, event: RunEvent & { type: "step.finished" }): View {
  const key = toStepKey(event.agent, event.index);
  const id = view.openSteps[key];
  if (id === undefined) return view;
  const rest = Object.fromEntries(Object.entries(view.openSteps).filter(([name]) => name !== key));
  const next = changeBlock(view, id, (block) =>
    block.kind === "text"
      ? {
          ...block,
          text: event.text,
          open: false,
          settled: block.text === "" ? event.text.length : block.settled,
        }
      : block,
  );
  return { ...next, openSteps: rest };
}

const bestFormat = new Intl.NumberFormat("en", { maximumSignificantDigits: 4 });

function toObjective(view: View, callId: string): string | null {
  const block = view.blocks.find((item) => item.kind === "tool" && item.id === callId);
  if (block?.kind !== "tool" || typeof block.input !== "object" || block.input === null)
    return null;
  const objective = "objective" in block.input ? block.input.objective : null;
  return typeof objective === "string" ? objective.toUpperCase() : null;
}

function toBest(view: View, event: RunEvent & { type: "tool.finished" }): string | null {
  const best = toBestValue(event.output_summary);
  if (best === null) return null;
  const figure = `${bestFormat.format(best.value)} ${best.unit}`.trim();
  const objective = toObjective(view, event.call_id);
  return objective === null ? figure : `${objective} ${figure}`;
}

function finishTool(view: View, event: RunEvent & { type: "tool.finished" }): View {
  return {
    ...view,
    studies: view.studies.map((study) =>
      study.id === event.call_id ? { ...study, best: toBest(view, event) } : study,
    ),
    blocks: view.blocks.map((block) => {
      if (block.kind !== "tool" || block.id !== event.call_id) return block;
      const failed = event.error !== undefined;
      return {
        ...block,
        state: failed ? "failed" : "done",
        summary: event.output_summary,
        duration: event.duration,
        error: event.error ?? null,
      };
    }),
  };
}

function changeProblem(view: View, event: RunEvent & { type: "state.changed" }): View {
  if (event.version <= view.problem.version) return view;
  if (event.version !== view.problem.version + 1) return { ...view, problemStale: true };
  const document = applyChanges(view.problem.document, event.changes);
  if (document === null) return { ...view, problemStale: true };
  return { ...view, problem: { version: event.version, document } };
}

function resolveRequest(view: View): View {
  if (view.request === null) return view;
  return {
    ...view,
    request: null,
    status: view.status === "waiting" ? "running" : view.status,
    blocks: view.blocks.map((block) =>
      block.kind === "request" ? { ...block, resolved: true } : block,
    ),
  };
}

function keepsRequest(event: RunEvent): boolean {
  if (event.type === "text.delta") return event.buffered === true;
  return event.type === "request" || event.type === "usage" || event.type === "state.changed";
}

function reduce(view: View, event: RunEvent): View {
  switch (event.type) {
    case "run.started":
      return event.parent === null ? { ...view, status: "running", loop: event.loop } : view;
    case "step.started":
      return startStep(view, event);
    case "text.delta":
      return changeText(view, event);
    case "step.finished":
      return finishStep(view, event);
    case "tool.started":
      return addBlock(view, {
        kind: "tool",
        id: event.call_id,
        agent: event.agent,
        tool: event.tool,
        input: event.input,
        state: "running",
        summary: "",
        duration: null,
        error: null,
      });
    case "tool.finished":
      return finishTool(view, event);
    case "state.changed":
      return changeProblem(view, event);
    case "request":
      return reduceRequest(view, event);
    case "usage":
      return { ...view, usage: toUsage(event) };
    case "study.recorded":
      return { ...view, studies: [...view.studies, toRecordedStudy(event)] };
    case "run.finished":
      return reduceFinished(view, event);
  }
}

function toRecordedStudy(event: RunEvent & { type: "study.recorded" }): RecordedStudy {
  return { id: event.call_id, name: event.study.replace(/^study\//, ""), best: null };
}

function toUsage(event: Usage): Usage {
  return {
    input_tokens: event.input_tokens,
    output_tokens: event.output_tokens,
    cost: event.cost,
  };
}

function reduceRequest(view: View, event: RunEvent & { type: "request" }): View {
  const request: RunRequest = {
    request: event.request,
    kind: event.kind,
    message: event.message,
    ...(event.call_id === undefined ? {} : { call_id: event.call_id }),
    ...(event.options === undefined ? {} : { options: event.options }),
  };
  const next = addBlock(view, {
    kind: "request",
    id: nextId(view),
    agent: event.agent,
    request,
    resolved: false,
  });
  return { ...next, request, status: "waiting" };
}

function reduceFinished(view: View, event: RunEvent & { type: "run.finished" }): View {
  if (event.parent !== null) return view;
  const next = addBlock(view, {
    kind: "end",
    id: nextId(view),
    agent: event.agent,
    status: event.status,
    message: event.message ?? null,
    reason: event.stop_reason,
    studies: view.studies,
  });
  const agents = Object.fromEntries(
    Object.entries(next.agents).map(([path, agent]) => [
      path,
      { ...agent, state: "done" as const },
    ]),
  );
  return { ...next, agents, status: event.status };
}

/** Pure reducer of the live run view: the same events always give the same view, live or replayed. */
export function applyEvent(view: View, event: RunEvent): View {
  const resolved = keepsRequest(event) ? view : resolveRequest(view);
  return reduce(touchAgent(resolved, event), event);
}

/** Replaces the problem state with a full copy from the server, unless the view already has a newer one. */
export function loadProblem(view: View, problem: ProblemState): View {
  if (problem.version < view.problem.version) return { ...view, problemStale: false };
  return { ...view, problem, problemStale: false };
}
