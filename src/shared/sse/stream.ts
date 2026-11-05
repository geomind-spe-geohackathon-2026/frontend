import { fetchEventSource } from "@microsoft/fetch-event-source";
import { api, toBaseUrl } from "@/shared/api/client";
import { ApiError, fromResponse } from "@/shared/api/errors";
import { session } from "@/shared/api/session";
import { toApiMode } from "@/shared/api/mode";
import { fromEvent } from "./events";
import { streamSocket } from "./socket";
import type { RunEvent } from "./types";

type Options = {
  path: string;
  signal: AbortSignal;
  onEvent: (event: RunEvent) => void;
  onFailure: (error: ApiError) => void;
  isFinished: () => boolean;
  lastEventId?: string;
  socketPath?: string;
};

const retryDelayMs = 1500;
const retryableStatuses = [408, 429];

function withToken(init: RequestInit | undefined): RequestInit {
  const headers = new Headers(init?.headers);
  const tokens = session.get();
  if (tokens !== null) headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  return { ...init, headers };
}

function toRefreshed(): Promise<boolean> {
  return api.GET("/identity/me").then(
    () => true,
    () => false,
  );
}

async function fetchWithToken(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, withToken(init));
  if (response.status !== 401) return response;
  if (!(await toRefreshed())) return response;
  return fetch(input, withToken(init));
}

function toSocketUrl(path: string): string {
  return `${toBaseUrl(import.meta.env.VITE_API_URL).replace(/^http/, "ws")}${path}`;
}

function toResume(lastEventId: string | null): { lastEventId?: string } {
  return lastEventId === null ? {} : { lastEventId };
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return error.status >= 500 || retryableStatuses.includes(error.status);
}

async function streamServerEvents(options: Options): Promise<void> {
  const headers: Record<string, string> = {};
  if (options.lastEventId !== undefined) headers["Last-Event-ID"] = options.lastEventId;
  try {
    await fetchEventSource(`${toBaseUrl(import.meta.env.VITE_API_URL)}${options.path}`, {
      signal: options.signal,
      headers,
      openWhenHidden: true,
      fetch: fetchWithToken,
      async onopen(response) {
        if (!response.ok) throw await fromResponse(response);
      },
      onclose() {
        if (!options.isFinished()) throw new Error("The stream closed before the run finished");
      },
      onmessage(message) {
        const event = fromEvent(message.event, message.data, message.id);
        if (event !== null) options.onEvent(event);
      },
      onerror(error: unknown) {
        if (!isRetryable(error)) throw error;
        return retryDelayMs;
      },
    });
  } catch (error: unknown) {
    if (options.signal.aborted) return;
    options.onFailure(
      error instanceof ApiError
        ? error
        : new ApiError({ status: 0, code: "stream_failed", message: "The live stream stopped" }),
    );
  }
}

function onceEach(onEvent: (event: RunEvent) => void): (event: RunEvent) => void {
  const seen = new Set<number>();
  return (event) => {
    if (event.sequence !== null) {
      if (seen.has(event.sequence)) return;
      seen.add(event.sequence);
    }
    onEvent(event);
  };
}

/** Reads a run's events over a WebSocket when it has a socket path, and over SSE when a socket cannot connect; a stored event that comes again (a reconnect replays from the start) is passed on once. */
export async function streamEvents(given: Options): Promise<void> {
  const options = { ...given, onEvent: onceEach(given.onEvent) };
  const { socketPath, lastEventId, ...rest } = options;
  const isReal = toApiMode(import.meta.env.VITE_API_MODE, import.meta.env.DEV) === "real";
  if (socketPath === undefined || !isReal) return streamServerEvents(options);
  const end = await streamSocket({
    ...rest,
    url: toSocketUrl(socketPath),
    lastEventId: lastEventId ?? null,
    refresh: toRefreshed,
  });
  if (!end.finished) await streamServerEvents({ ...rest, ...toResume(end.lastEventId) });
}
