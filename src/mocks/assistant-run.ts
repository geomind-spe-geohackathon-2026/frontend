import type { Chat, Message, Run } from "@/shared/api/types";
import type { RunEvent } from "@/shared/sse/types";
import {
  exampleApproval,
  toApprovalRequest,
  toCancelled,
  toClosing,
  toEvents,
  toOpening,
  toRecording,
  type Answer,
  type Draft,
} from "./assistant-script";
import type { Feed } from "./assistant-stream";

export type Problem = { version: number; state: Record<string, unknown> };

export type MockChat = { chat: Chat; messages: Message[]; problem: Problem };

export type MockRun = {
  run: Run;
  question: string;
  feed: Feed;
  counter: number;
  finalText: string;
  cancelled: boolean;
  waiting: ((answer: Answer | "cancelled") => void) | null;
};

const paceMs = import.meta.env.MODE === "test" ? 0 : 450;
const deltaMs = paceMs / 5;

function pause(milliseconds: number): Promise<void> {
  if (milliseconds === 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/** Creates the in-memory state of a run that is about to start. */
export function toMockRun(run: Run, question: string): MockRun {
  const feed: Feed = { events: [], openDeltas: [], listeners: new Set(), finished: false };
  return { run, question, feed, counter: 1, finalText: "", cancelled: false, waiting: null };
}

function applyProblem(chat: MockChat, event: RunEvent & { type: "state.changed" }): void {
  const known: unknown = chat.problem.state.results;
  const results: unknown[] = Array.isArray(known) ? known : [];
  event.changes.forEach((change) => {
    if (change.path === "/goal") chat.problem.state.goal = change.value;
    if (change.path === "/results") chat.problem.state.results = change.value;
    if (change.path === "/results/-") chat.problem.state.results = [...results, change.value];
  });
  chat.problem.version = event.version;
}

function finishRun(
  mock: MockRun,
  chat: MockChat,
  event: RunEvent & { type: "run.finished" },
): void {
  mock.run.status = event.status;
  mock.run.ended = new Date().toISOString();
  mock.feed.finished = true;
  chat.chat.last_run = { id: mock.run.id, status: event.status };
  if (event.status === "done") {
    chat.messages.push({
      id: `${mock.run.id}-answer`,
      chat: chat.chat.id,
      role: "assistant",
      content: mock.finalText,
      created: mock.run.ended,
      run: mock.run.id,
      ...(event.suggestions === undefined ? {} : { suggestions: event.suggestions }),
    });
  }
}

function track(mock: MockRun, chat: MockChat, event: RunEvent): void {
  if (mock.run.status === "waiting" && event.type !== "request") {
    mock.run.status = "running";
    mock.run.request = null;
  }
  if (event.type === "usage") {
    mock.run.usage = {
      input_tokens: event.input_tokens,
      output_tokens: event.output_tokens,
      cost: event.cost,
    };
  }
  if (event.type === "request") {
    mock.run.status = "waiting";
    mock.run.request = exampleApproval;
  }
  if (event.type === "state.changed") applyProblem(chat, event);
  if (event.type === "step.finished" && event.agent === "coordinator" && event.text !== "") {
    mock.finalText = event.text;
  }
  if (event.type === "run.finished" && event.parent === null) finishRun(mock, chat, event);
}

/** Stores one event of the run, updates the run and chat, and tells the open streams. */
export function record(mock: MockRun, chat: MockChat, draft: Draft): void {
  const [event] = toEvents([draft], mock.run.id, mock.counter);
  mock.counter += 1;
  if (event === undefined) return;
  track(mock, chat, event);
  if (event.type === "text.delta") mock.feed.openDeltas.push(event);
  else mock.feed.events.push(event);
  if (event.type === "step.finished") mock.feed.openDeltas = [];
  mock.feed.listeners.forEach((listener) => {
    listener(event);
  });
}

function wasCancelled(mock: MockRun): boolean {
  return mock.cancelled;
}

async function playDrafts(mock: MockRun, chat: MockChat, drafts: Draft[]): Promise<void> {
  for (const draft of drafts) {
    if (wasCancelled(mock)) return;
    await pause(draft.type === "text.delta" ? deltaMs : paceMs);
    if (wasCancelled(mock)) return;
    record(mock, chat, draft);
  }
}

function waitForAnswer(mock: MockRun): Promise<Answer | "cancelled"> {
  return new Promise((resolve) => {
    mock.waiting = resolve;
  });
}

/** Plays the scripted run: opening, approval request, wait for the answer, closing; stops when cancelled. */
export async function play(mock: MockRun, chat: MockChat): Promise<void> {
  const version = chat.problem.version;
  await playDrafts(mock, chat, toOpening(version, mock.run.id, mock.question));
  if (wasCancelled(mock)) return;
  record(mock, chat, toApprovalRequest());
  const answer = await waitForAnswer(mock);
  if (answer === "cancelled") return;
  await playDrafts(mock, chat, toClosing(answer));
}

/** Gives the pending approval its answer; the player continues. */
export function answerRun(mock: MockRun, answer: Answer): void {
  mock.waiting?.(answer);
  mock.waiting = null;
}

/** Cancels a run that has not finished: stops the player and ends the run with the cancelled status. */
export function cancelRun(mock: MockRun, chat: MockChat): void {
  if (mock.feed.finished) return;
  mock.cancelled = true;
  mock.waiting?.("cancelled");
  mock.waiting = null;
  record(mock, chat, toCancelled());
}

/** Plays the whole script at once, for the example run that is already finished. */
export function finishAtOnce(mock: MockRun, chat: MockChat): void {
  toRecording(chat.problem.version, mock.run.id, mock.question, "approved").forEach((draft) => {
    record(mock, chat, draft);
  });
}
