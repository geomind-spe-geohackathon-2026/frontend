import type { RunEvent, RunEventBody, RunRequest, Usage } from "@/shared/sse/types";

export type Draft = RunEventBody & { agent: string };

export type Answer = "approved" | "denied";

export const coordinatorPath = "coordinator";
export const designerPath = "coordinator.designer";

const callStudy = "example-call-study";

export const exampleApproval: RunRequest = {
  request: "example-request-1",
  call_id: callStudy,
  kind: "approval",
  message: "Run an uncertainty study on the example plant? It starts a long calculation.",
};

const small: Usage = { input_tokens: 1200, output_tokens: 180, cost: 0.004 };

function toChunks(text: string): string[] {
  return text.split(/(?<=\s)/);
}

function speak(agent: string, index: number, text: string, model: string): Draft[] {
  return [
    { type: "step.started", agent, index, model },
    ...toChunks(text).map((chunk): Draft => ({ type: "text.delta", agent, index, text: chunk })),
    { type: "step.finished", agent, index, usage: small, text },
  ];
}

function toolCall(agent: string, index: number, id: string, name: string, input: unknown): Draft[] {
  return [
    { type: "tool.started", agent, index, call_id: id, tool: name, input },
    {
      type: "tool.finished",
      agent,
      index,
      call_id: id,
      output_summary: `${name} finished`,
      duration: 0.4,
    },
  ];
}

function toCoordinatorStart(runId: string, question: string): Draft[] {
  const agent = coordinatorPath;
  const text = `Reading the problem before I answer: ${question}`;
  return [
    { type: "run.started", agent, run: runId, loop: "design" },
    { type: "step.started", agent, index: 0, model: "example/model-large" },
    ...toChunks(text).map((chunk): Draft => ({ type: "text.delta", agent, index: 0, text: chunk })),
    ...toolCall(agent, 0, "example-call-read", "read_case", {}),
    { type: "step.finished", agent, index: 0, usage: small, text },
    { type: "usage", agent, ...small },
    { type: "step.started", agent, index: 1, model: "example/model-large" },
    {
      type: "tool.started",
      agent,
      index: 1,
      call_id: "example-call-delegate",
      tool: "delegate",
      input: { agent: "designer", task: "Size the plant and check the uncertainty." },
    },
  ];
}

function toDesignerStart(runId: string, stateVersion: number): Draft[] {
  const agent = designerPath;
  return [
    { type: "run.started", agent, run: `${runId}.designer`, loop: "design" },
    ...speak(agent, 0, "I will size the plant first.", "example/model-small"),
    ...toolCall(agent, 1, "example-call-size", "size_plant", { module: "example" }),
    {
      type: "state.changed",
      agent,
      version: stateVersion + 2,
      changes: [{ op: "add", path: "/results/-", value: { id: "R1", text: "Plant sized" } }],
    },
    { type: "usage", agent, input_tokens: 2600, output_tokens: 420, cost: 0.009 },
    { type: "step.started", agent, index: 2, model: "example/model-small" },
    {
      type: "tool.started",
      agent,
      index: 2,
      call_id: callStudy,
      tool: "run_study",
      input: { kind: "uncertainty" },
    },
  ];
}

/** Example events of a run up to the approval request; the problem state versions follow `stateVersion`. */
export function toOpening(stateVersion: number, runId: string, question: string): Draft[] {
  return [
    ...toCoordinatorStart(runId, question),
    {
      type: "state.changed",
      agent: coordinatorPath,
      version: stateVersion + 1,
      changes: [
        { op: "add", path: "/goal", value: question },
        { op: "add", path: "/results", value: [] },
      ],
    },
    ...toDesignerStart(runId, stateVersion),
  ];
}

function toStudyResult(answer: Answer): Draft {
  const base = {
    type: "tool.finished",
    agent: designerPath,
    index: 2,
    call_id: callStudy,
  } as const;
  if (answer === "approved") {
    return { ...base, output_summary: "uncertainty study queued", duration: 1.1 };
  }
  return { ...base, output_summary: "", duration: 0.1, error: "denied by the user" };
}

/** The events after the approval request, for the given answer, up to the end of the run. */
export function toClosing(answer: Answer): Draft[] {
  const text =
    answer === "approved"
      ? "The study is queued. You can follow it on the Study page."
      : "Understood, I skip the study.";
  return [
    toStudyResult(answer),
    { type: "step.finished", agent: designerPath, index: 2, usage: small, text: "" },
    ...speak(designerPath, 3, text, "example/model-small"),
    { type: "run.finished", agent: designerPath, status: "done", stop_reason: "completed" },
    {
      type: "tool.finished",
      agent: coordinatorPath,
      index: 1,
      call_id: "example-call-delegate",
      output_summary: text,
      duration: 6.2,
    },
    { type: "step.finished", agent: coordinatorPath, index: 1, usage: small, text: "" },
    ...speak(coordinatorPath, 2, `The designer reports: ${text}`, "example/model-large"),
    { type: "usage", agent: coordinatorPath, input_tokens: 5200, output_tokens: 900, cost: 0.021 },
    { type: "run.finished", agent: coordinatorPath, status: "done", stop_reason: "completed" },
  ];
}

/** The request event of the example approval, raised by the designer. */
export function toApprovalRequest(): Draft {
  return { type: "request", agent: designerPath, ...exampleApproval };
}

/** A whole example run as drafts: opening, approval request and closing for the answer. */
export function toRecording(
  stateVersion: number,
  runId: string,
  question: string,
  answer: Answer,
): Draft[] {
  return [...toOpening(stateVersion, runId, question), toApprovalRequest(), ...toClosing(answer)];
}

/** The last event of a run that the user cancelled. */
export function toCancelled(): Draft {
  return {
    type: "run.finished",
    agent: coordinatorPath,
    status: "cancelled",
    stop_reason: "cancelled",
  };
}

/** Turns drafts into events: the parent run id for delegated agents and sequence numbers from `first`; deltas are not stored, so they have none. */
export function toEvents(drafts: Draft[], runId: string, first: number): RunEvent[] {
  return drafts.map((draft, position) => ({
    ...draft,
    sequence: draft.type === "text.delta" ? null : first + position,
    parent: draft.agent === coordinatorPath ? null : runId,
  }));
}
