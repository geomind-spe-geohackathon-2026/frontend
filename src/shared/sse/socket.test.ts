import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { session } from "@/shared/api/session";
import { streamSocket } from "./socket";
import type { RunEvent } from "./types";

class FakeSocket {
  static all: FakeSocket[] = [];
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((message: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;

  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }

  send(text: string) {
    this.sent.push(text);
  }

  close(code = 1006) {
    this.onclose?.({ code });
  }

  frame(event: string, id: number | null, data: object) {
    this.onmessage?.({
      data: JSON.stringify({
        event,
        id,
        data: { agent: "coordinator", parent: null, ...data },
      }),
    });
  }
}

const usage = { input_tokens: 1, output_tokens: 2, cost: 0.1 };
const finished = { status: "done", stop_reason: "end" };

function listen(lastEventId: string | null = null, refresh = () => Promise.resolve(false)) {
  const events: RunEvent[] = [];
  const failures: string[] = [];
  const controller = new AbortController();
  let done = false;
  const end = streamSocket({
    url: "ws://test/runs/r1/stream",
    signal: controller.signal,
    isFinished: () => done,
    refresh,
    lastEventId,
    onEvent: (event) => {
      events.push(event);
      if (event.type === "run.finished") done = true;
    },
    onFailure: (error) => failures.push(error.code),
  });
  return { events, failures, end, controller };
}

async function next(count: number): Promise<FakeSocket> {
  await vi.waitFor(() => {
    expect(FakeSocket.all.length).toBeGreaterThanOrEqual(count);
  });
  const socket = FakeSocket.all[count - 1];
  if (socket === undefined) throw new Error("no socket");
  return socket;
}

beforeEach(() => {
  FakeSocket.all = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  session.set({ accessToken: "token-1", refreshToken: "refresh-1" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("streamSocket", () => {
  it("sends the token in its first message, not in the url, and delivers events", async () => {
    const { events, end } = listen("8");
    const socket = await next(1);
    socket.onopen?.();
    expect(JSON.parse(socket.sent[0] ?? "")).toEqual({ token: "token-1", after: 8 });
    expect(socket.url).not.toContain("token-1");
    socket.frame("usage", 9, usage);
    socket.frame("text.delta", null, { index: 0, text: "\u0633\u0644\u0627\u0645" });
    socket.frame("run.finished", 10, finished);
    socket.close(1000);
    await expect(end).resolves.toMatchObject({ finished: true });
    expect(events.map((event) => [event.type, event.sequence])).toEqual([
      ["usage", 9],
      ["text.delta", null],
      ["run.finished", 10],
    ]);
  });

  it("ignores a heartbeat", async () => {
    const { events, end, controller } = listen();
    const socket = await next(1);
    socket.onmessage?.({ data: JSON.stringify({ event: "heartbeat" }) });
    expect(events).toEqual([]);
    controller.abort();
    await end;
  });

  it("gives up at once when a socket never worked, so SSE can take over", async () => {
    const { end } = listen("4");
    (await next(1)).close(1006);
    await expect(end).resolves.toEqual({ finished: false, lastEventId: "4" });
  });

  it("gives up when a socket does not open in time", async () => {
    vi.useFakeTimers();
    const { end } = listen();
    await vi.advanceTimersByTimeAsync(5000);
    await expect(end).resolves.toMatchObject({ finished: false });
  });

  it("reconnects after a drop and resumes after the last event", async () => {
    vi.useFakeTimers();
    const { end, controller } = listen();
    const first = await next(1);
    first.onopen?.();
    first.frame("usage", 12, usage);
    first.close(1006);
    await vi.advanceTimersByTimeAsync(1500);
    const second = await next(2);
    second.onopen?.();
    expect(JSON.parse(second.sent[0] ?? "")).toMatchObject({ after: 12 });
    controller.abort();
    await end;
  });

  it("refreshes an expired token once and tries again", async () => {
    const refresh = vi.fn(() => Promise.resolve(true));
    const { failures, end, controller } = listen(null, refresh);
    (await next(1)).close(4401);
    await next(2);
    expect(refresh).toHaveBeenCalledOnce();
    expect(failures).toEqual([]);
    controller.abort();
    await end;
  });

  it("reports a session that cannot be refreshed", async () => {
    const { failures, end } = listen();
    (await next(1)).close(4401);
    await expect(end).resolves.toMatchObject({ finished: true });
    expect(failures).toEqual(["unauthorized"]);
  });

  it("reports a missing run without falling back", async () => {
    const { failures, end } = listen();
    (await next(1)).close(4404);
    await expect(end).resolves.toMatchObject({ finished: true });
    expect(failures).toEqual(["run_not_found"]);
  });
});
