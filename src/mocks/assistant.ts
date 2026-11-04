import { http, HttpResponse, type RequestHandler } from "msw";
import type { Page } from "@/shared/api/pagination";
import type {
  Chat,
  ChatCreate,
  ChatUpdate,
  ChatState,
  Message,
  MessageSent,
  Run,
  RunAnswer,
  Usage,
} from "@/shared/api/types";
import type { LogStep } from "@/shared/sse/runlog";
import { toRunLog } from "./assistant-log";
import {
  answerRun,
  cancelRun,
  finishAtOnce,
  play,
  toMockRun,
  type MockChat,
  type MockRun,
} from "./assistant-run";
import { toStream } from "./assistant-stream";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

type World = { chats: MockChat[]; runs: MockRun[] };
type WithId = { id: string };

const emptyUsage = { input_tokens: 0, output_tokens: 0, cost: 0 };
const seedTime = "2026-10-31T09:00:00Z";

function toNewRun(world: World, chat: Chat, started: string): Run {
  return {
    id: `example-run-${String(world.runs.length + 1)}`,
    chat: chat.id,
    project: chat.project,
    status: "running",
    loop: "design",
    started,
    ended: null,
    usage: emptyUsage,
    request: null,
    error: null,
  };
}

function toNewChat(world: World, project: string, title: string, created: string): MockChat {
  const id = `example-chat-${String(world.chats.length + 1)}`;
  const chat: Chat = { id, project, title, created, last_run: null };
  const mock: MockChat = { chat, messages: [], problem: { version: 0, state: {} } };
  world.chats.push(mock);
  return mock;
}

function addMessage(chat: MockChat, role: Message["role"], content: string, run: Run): Message {
  const message: Message = {
    id: `${run.id}-${role}`,
    chat: chat.chat.id,
    role,
    content,
    created: run.started ?? seedTime,
    run: run.id,
  };
  chat.messages.push(message);
  return message;
}

function startRun(world: World, chat: MockChat, content: string, started: string): MessageSent {
  const run = toNewRun(world, chat.chat, started);
  const mock = toMockRun(run, content);
  world.runs.push(mock);
  chat.chat.last_run = { id: run.id, status: run.status };
  const message = addMessage(chat, "user", content, run);
  void play(mock, chat);
  return { message, run };
}

function createWorld(): World {
  const world: World = { chats: [], runs: [] };
  const chat = toNewChat(world, "example-project-1", "Design the example plant", seedTime);
  const run = toNewRun(world, chat.chat, seedTime);
  const mock = toMockRun(run, "Which plant fits the example problem?");
  world.runs.push(mock);
  addMessage(chat, "user", mock.question, run);
  finishAtOnce(mock, chat);
  return world;
}

function findChat(world: World, id: string | undefined): MockChat | null {
  return world.chats.find((item) => item.chat.id === id) ?? null;
}

function findRun(world: World, id: string): MockRun | null {
  return world.runs.find((item) => item.run.id === id) ?? null;
}

function isActive(run: Run): boolean {
  return run.status === "queued" || run.status === "running" || run.status === "waiting";
}

function toMarkdown(steps: LogStep[], run: Run): string {
  const lines = [`# Run ${run.id}`, ""];
  steps.forEach((step) => {
    lines.push(`## ${step.agent} step ${String(step.index)}`);
    step.llm_calls.forEach((call) => lines.push(`${call.model}: ${call.answer}`));
    step.tool_calls.forEach((call) => lines.push(`- ${call.tool}: ${String(call.output)}`));
    lines.push("");
  });
  return lines.join("\n");
}

const chatMissing = () => toErrorResponse(404, "chat_not_found", "The chat does not exist");
const runMissing = () => toErrorResponse(404, "run_not_found", "The run does not exist");

function chatHandlers(world: World): RequestHandler[] {
  return [
    http.get(toRoute("/assistant/chat"), ({ request }) => {
      const project = new URL(request.url).searchParams.get("project");
      const items = world.chats.filter((item) => item.chat.project === project);
      return HttpResponse.json<Page<Chat>>({
        items: items.map((item) => item.chat).reverse(),
        next: null,
      });
    }),
    http.post<NoParams, ChatCreate>(toRoute("/assistant/chat"), async ({ request }) => {
      const body = await request.json();
      const created = new Date().toISOString();
      const chat = toNewChat(world, body.project, body.title ?? "New chat", created);
      return HttpResponse.json(chat.chat, { status: 201 });
    }),
    http.patch<WithId, ChatUpdate>(toRoute("/assistant/chat/:id"), async (input) => {
      const chat = findChat(world, input.params.id);
      if (chat === null) return chatMissing();
      chat.chat.title = (await input.request.json()).title;
      return HttpResponse.json(chat.chat);
    }),
    http.delete<WithId>(toRoute("/assistant/chat/:id"), ({ params }) => {
      const chat = findChat(world, params.id);
      if (chat === null) return chatMissing();
      const busy = world.runs.some((item) => item.run.chat === chat.chat.id && isActive(item.run));
      if (busy) return toErrorResponse(409, "conflict", "A run of this chat is still active");
      world.chats = world.chats.filter((item) => item !== chat);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

function messageHandlers(world: World): RequestHandler[] {
  return [
    http.get<WithId>(toRoute("/assistant/chat/:id/messages"), ({ params }) => {
      const chat = findChat(world, params.id);
      if (chat === null) return chatMissing();
      return HttpResponse.json<Page<Message>>({ items: chat.messages, next: null });
    }),
    http.post<WithId, { content: string }>(
      toRoute("/assistant/chat/:id/messages"),
      async ({ params, request }) => {
        const chat = findChat(world, params.id);
        if (chat === null) return chatMissing();
        const { content } = await request.json();
        const sent = startRun(world, chat, content, new Date().toISOString());
        return HttpResponse.json(sent, { status: 201 });
      },
    ),
    http.get<WithId>(toRoute("/assistant/chat/:id/state"), ({ params }) => {
      const chat = findChat(world, params.id);
      if (chat === null) return chatMissing();
      const { version, state } = chat.problem;
      return HttpResponse.json<ChatState>({ version, state: version === 0 ? null : state });
    }),
  ];
}

function agentsHandler(world: World): RequestHandler {
  return http.get<WithId>(toRoute("/assistant/runs/:id/agents"), ({ params }) => {
    const mock = findRun(world, params.id);
    if (mock === null) return runMissing();
    const agent = (name: string, used: number, cost: number) => ({
      session: `${mock.run.id}-${name}`,
      parent_session: name === "coordinator" ? null : `${mock.run.id}-coordinator`,
      agent: name === "coordinator" ? "coordinator" : `coordinator.${name}`,
      model: "example/model-large",
      status: "finished",
      steps: 2,
      llm_calls: 2,
      input_tokens: used * 2,
      output_tokens: 400,
      cost,
      context_used: used,
      context_window: 128000,
      context_left: 128000 - used,
      tool_calls: [{ call_id: `${name}-1`, tool: "read_case", error: null, duration: 0.4 }],
    });
    return HttpResponse.json({
      run: {
        id: mock.run.id,
        status: mock.run.status,
        input_tokens: 9600,
        output_tokens: 800,
        cost: 0.03,
        llm_calls: 4,
        tool_calls: 2,
      },
      agents: [agent("coordinator", 3200, 0.02), agent("designer", 1600, 0.01)],
    });
  });
}

function runHandlers(world: World): RequestHandler[] {
  return [
    http.get(toRoute("/assistant/runs"), ({ request }) => {
      const query = new URL(request.url).searchParams;
      const items = world.runs
        .map((item) => item.run)
        .filter((run) => run.project === query.get("project"))
        .filter((run) => query.get("status") !== "active" || isActive(run));
      return HttpResponse.json<Page<Run>>({ items: items.reverse(), next: null });
    }),
    http.get<WithId>(toRoute("/assistant/runs/:id"), ({ params }) => {
      const mock = findRun(world, params.id);
      return mock === null ? runMissing() : HttpResponse.json(mock.run);
    }),
    agentsHandler(world),
    http.get(toRoute("/assistant/suggestions"), () =>
      HttpResponse.json({
        suggestions: [
          {
            label: "Build the case from my files",
            message: "Build the case from the project's files.",
          },
          { label: "Build the case by questions", message: "Ask me questions to build the case." },
        ],
      }),
    ),
    http.get(toRoute("/assistant/usage"), ({ request }) => {
      const project = new URL(request.url).searchParams.get("project");
      const runs = world.runs.filter((item) => item.run.project === project);
      const sum = (pick: (run: Run) => number) =>
        runs.reduce((total, item) => total + pick(item.run), 0);
      return HttpResponse.json<Usage>({
        runs: runs.length,
        input_tokens: sum((run) => run.usage.input_tokens),
        output_tokens: sum((run) => run.usage.output_tokens),
        cost: sum((run) => run.usage.cost),
      });
    }),
  ];
}

function liveHandlers(world: World): RequestHandler[] {
  return [
    http.get<WithId>(toRoute("/assistant/runs/:id/events"), ({ params, request }) => {
      const mock = findRun(world, params.id);
      if (mock === null) return runMissing();
      const lastId = Number(request.headers.get("last-event-id") ?? "0");
      return new HttpResponse(toStream(mock.feed, lastId), {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }),
    http.post<WithId, RunAnswer>(toRoute("/assistant/runs/:id/answer"), async (input) => {
      const mock = findRun(world, input.params.id);
      if (mock === null) return runMissing();
      if (mock.run.status !== "waiting") {
        return toErrorResponse(409, "run_not_waiting", "The run is not waiting for an answer");
      }
      const { answer } = await input.request.json();
      answerRun(mock, "approved" in answer && answer.approved ? "approved" : "denied");
      return HttpResponse.json(mock.run);
    }),
    http.post<WithId>(toRoute("/assistant/runs/:id/cancel"), ({ params }) => {
      const mock = findRun(world, params.id);
      const chat = findChat(world, mock?.run.chat);
      if (mock === null || chat === null) return runMissing();
      cancelRun(mock, chat);
      return HttpResponse.json(mock.run);
    }),
  ];
}

function logHandlers(world: World): RequestHandler[] {
  return [
    http.get<WithId>(toRoute("/assistant/runs/:id/log"), ({ params }) => {
      const mock = findRun(world, params.id);
      if (mock === null) return runMissing();
      return HttpResponse.json(toRunLog(mock.run, mock.feed.events, mock.question));
    }),
    http.get<WithId>(toRoute("/assistant/runs/:id/log/export"), ({ params, request }) => {
      const mock = findRun(world, params.id);
      if (mock === null) return runMissing();
      const log = toRunLog(mock.run, mock.feed.events, mock.question);
      if (new URL(request.url).searchParams.get("format") !== "md") {
        return HttpResponse.json(log);
      }
      return new HttpResponse(toMarkdown(log.steps, mock.run), {
        headers: { "Content-Type": "text/markdown" },
      });
    }),
  ];
}

/** Example assistant routes: chats, messages, runs, a scripted live run over SSE, run logs and usage. */
export function assistantHandlers(): RequestHandler[] {
  const world = createWorld();
  return [
    ...chatHandlers(world),
    ...messageHandlers(world),
    ...runHandlers(world),
    ...liveHandlers(world),
    ...logHandlers(world),
  ];
}
