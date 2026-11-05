import type { NextStep } from "@/shared/sse/next-steps";
import type { RunStatus } from "@/shared/api/types";
import { toBestValue } from "@/shared/sse/pretty";
import type { RunEvent, RunRequest, ToolProblem, Usage } from "@/shared/sse/types";
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
      problem: ToolProblem | null;
    }
  | {
      kind: "request";
      id: string;
      agent: string;
      request: RunRequest;
      resolved: boolean;
      answer?: RunAnswerNote;
    }
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

/** What settled a request, from the run's answer event. */
export type RunAnswerNote = { decision: string; reason: string | null; text: string | null; tool: string | null; by: string };

export type View = {
  status: RunStatus;
  loop: string | null;
  blocks: Block[];
  agents: Record<string, AgentNode>;
  openSteps: Record<string, string>;
  usage: Usage;
  stepUsage: Usage;
  context: number;
  window: number | null;
  suggestions: NextStep[];
  request: RunRequest | null;
  problem: ProblemState;
  problemStale: boolean;
  studies: RecordedStudy[];
  retry: string | null;
};

/** The view before any event: nothing has happened yet. */
export const emptyView: View = {
  status: "queued",
  loop: null,
  blocks: [],
  agents: {},
  openSteps: {},
  usage: { input_tokens: 0, output_tokens: 0, cost: 0 },
  stepUsage: { input_tokens: 0, output_tokens: 0, cost: 0 },
  context: 0,
  window: null,
  suggestions: [],
  request: null,
  problem: { version: 0, document: null },
  problemStale: false,
  studies: [],
  retry: null,
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
  const window = event.context_window ?? view.window;
  return { ...next, openSteps: { ...next.openSteps, [key]: id }, window };
}

function finishStep(view: View, event: RunEvent & { type: "step.finished" }): View {
  const key = toStepKey(event.agent, event.index);
  const id = view.openSteps[key];
  if (id === undefined) {
    return { ...view, context: event.usage.input_tokens, stepUsage: addUsage(view.stepUsage, event.usage) };
  }
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
  return {
    ...next,
    openSteps: rest,
    context: event.usage.input_tokens,
    stepUsage: addUsage(view.stepUsage, event.usage),
  };
}

function addUsage(total: Usage, step: Usage): Usage {
  return {
    input_tokens: total.input_tokens + step.input_tokens,
    output_tokens: total.output_tokens + step.output_tokens,
    cost: total.cost + step.cost,
  };
}

/** The run's usage so far: the run's own total, or the sum of its finished steps (nested agents too) while that is larger. */
export function toRunUsage(view: View): Usage {
  return view.stepUsage.input_tokens > view.usage.input_tokens ? view.stepUsage : view.usage;
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

const noCaseYet = "No case yet: the assistant builds it from the project's files.";

function isNoCaseYet(block: Block, event: RunEvent & { type: "tool.finished" }): boolean {
  return block.kind === "tool" && block.tool === "read_case" && event.problem?.code === "no_case";
}

function finishTool(view: View, event: RunEvent & { type: "tool.finished" }): View {
  return {
    ...view,
    studies: view.studies.map((study) =>
      study.id === event.call_id ? { ...study, best: toBest(view, event) } : study,
    ),
    blocks: view.blocks.map((block) => {
      if (block.kind !== "tool" || block.id !== event.call_id) return block;
      if (isNoCaseYet(block, event)) {
        return { ...block, state: "done", summary: noCaseYet, duration: event.duration, error: null, problem: null };
      }
      const failed = event.error !== undefined || event.problem !== undefined;
      return {
        ...block,
        state: failed ? "failed" : "done",
        summary: event.output_summary,
        duration: event.duration,
        error: event.error ?? event.problem?.message ?? null,
        problem: event.problem ?? null,
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
        problem: null,
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
    case "retry":
      return { ...view, retry: toRetryText(event) };
    case "answer":
      return noteAnswer(view, event);
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
  return { ...next, agents, status: event.status, suggestions: event.suggestions ?? [] };
}

function noteAnswer(view: View, event: RunEvent & { type: "answer" }): View {
  const { decision, reason, text, tool, by } = event;
  return {
    ...view,
    blocks: view.blocks.map((block) =>
      block.kind === "request" && block.request.request === event.request
        ? { ...block, resolved: true, answer: { decision, reason, text, tool, by } }
        : block,
    ),
  };
}

function toRetryText(event: RunEvent & { type: "retry" }): string {
  const status = event.status === null ? "" : ` (${String(event.status)})`;
  const next = event.attempt === 0 ? "trying the next model" : "trying again";
  const wait = event.delay > 0 ? ` in ${String(Math.round(event.delay))} s` : "";
  return `The model provider is busy${status}; ${next}${wait}`;
}

/** Pure reducer of the live run view: the same events always give the same view, live or replayed. */
export function applyEvent(view: View, event: RunEvent): View {
  const resolved = keepsRequest(event) ? view : resolveRequest(view);
  const next = reduce(touchAgent(resolved, event), event);
  return event.type === "retry" || next.retry === null ? next : { ...next, retry: null };
}

/** Replaces the problem state with a full copy from the server, unless the view already has a newer one. */
export function loadProblem(view: View, problem: ProblemState): View {
  if (problem.version < view.problem.version) return { ...view, problemStale: false };
  return { ...view, problem, problemStale: false };
}
