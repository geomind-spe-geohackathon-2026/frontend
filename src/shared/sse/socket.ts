import { ApiError } from "@/shared/api/errors";
import { session } from "@/shared/api/session";
import { fromPayload } from "./events";
import type { RunEvent } from "./types";

type Options = {
  url: string;
  signal: AbortSignal;
  onEvent: (event: RunEvent) => void;
  onFailure: (error: ApiError) => void;
  isFinished: () => boolean;
  refresh: () => Promise<boolean>;
  lastEventId: string | null;
};

type Attempt = { code: number; received: boolean };

/** How a socket stream ended: finished, or given up on so that SSE can resume after `lastEventId`. */
export type SocketEnd = { finished: boolean; lastEventId: string | null };

const openTimeoutMs = 5000;
const retryDelayMs = 1500;
const maxEmptyAttempts = 3;
const unauthorized = 4401;
const notFound = 4404;
const noEvent = -1;

function fromFrame(text: string): { type: string; data: unknown; id: string | null } | null {
  const body: unknown = JSON.parse(text);
  if (typeof body !== "object" || body === null) return null;
  if (!("event" in body) || typeof body.event !== "string" || !("data" in body)) return null;
  return {
    type: body.event,
    data: body.data,
    id: "id" in body && typeof body.id === "number" ? String(body.id) : null,
  };
}

function toFailure(code: string, message: string): ApiError {
  return new ApiError({ status: 0, code, message });
}

function open(options: Options, after: () => string | null, onId: (id: string) => void) {
  return new Promise<Attempt>((resolve) => {
    const socket = new WebSocket(options.url);
    let received = false;
    const stop = () => {
      socket.close(1000);
    };
    const timer = setTimeout(() => {
      socket.close();
    }, openTimeoutMs);
    options.signal.addEventListener("abort", stop);
    socket.onopen = () => {
      clearTimeout(timer);
      const token = session.get()?.accessToken ?? "";
      socket.send(JSON.stringify({ token, after: Number(after() ?? noEvent) }));
    };
    socket.onmessage = (message: MessageEvent<string>) => {
      received = true;
      try {
        const frame = fromFrame(message.data);
        if (frame === null) return;
        if (frame.id !== null) onId(frame.id);
        const event = fromPayload(frame.type, frame.data, frame.id ?? "");
        if (event !== null) options.onEvent(event);
      } catch (error: unknown) {
        options.onFailure(
          error instanceof ApiError
            ? error
            : toFailure("invalid_event", "The live stream sent an invalid event"),
        );
        socket.close(1000);
      }
    };
    socket.onclose = (event) => {
      clearTimeout(timer);
      options.signal.removeEventListener("abort", stop);
      resolve({ code: event.code, received });
    };
  });
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/** Reads a run's events over a WebSocket and reconnects after the last seen event; a socket that never works ends with `finished: false`. */
export async function streamSocket(options: Options): Promise<SocketEnd> {
  let lastEventId = options.lastEventId;
  let refreshed = false;
  let worked = false;
  let empty = 0;
  const ended = { finished: true, lastEventId: null };
  for (;;) {
    const attempt = await open(
      options,
      () => lastEventId,
      (id) => {
        lastEventId = id;
      },
    );
    if (options.signal.aborted || options.isFinished()) return ended;
    if (attempt.code === unauthorized) {
      if (!refreshed && (await options.refresh())) {
        refreshed = true;
        continue;
      }
      options.onFailure(toFailure("unauthorized", "The session has ended"));
      return ended;
    }
    if (attempt.code === notFound) {
      options.onFailure(toFailure("run_not_found", "Run not found"));
      return ended;
    }
    worked ||= attempt.received;
    empty = attempt.received ? 0 : empty + 1;
    if (!worked || empty >= maxEmptyAttempts) return { finished: false, lastEventId };
    await wait(retryDelayMs, options.signal);
  }
}
