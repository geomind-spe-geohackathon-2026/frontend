import { fetchEventSource } from "@microsoft/fetch-event-source";
import { api, toBaseUrl } from "@/shared/api/client";
import { ApiError, fromResponse } from "@/shared/api/errors";
import { session } from "@/shared/api/session";
import { fromEvent } from "./events";
import type { RunEvent } from "./types";

type Options = {
  path: string;
  signal: AbortSignal;
  onEvent: (event: RunEvent) => void;
  onFailure: (error: ApiError) => void;
  isFinished: () => boolean;
  lastEventId?: string;
};

const retryDelayMs = 1500;
const retryableStatuses = [408, 429];

function withToken(init: RequestInit | undefined): RequestInit {
  const headers = new Headers(init?.headers);
  const tokens = session.get();
  if (tokens !== null) headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  return { ...init, headers };
}

async function fetchWithToken(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, withToken(init));
  if (response.status !== 401) return response;
  const refreshed = await api.GET("/identity/me").then(
    () => true,
    () => false,
  );
  if (!refreshed) return response;
  return fetch(input, withToken(init));
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return error.status >= 500 || retryableStatuses.includes(error.status);
}

/** Reads the events of a run over SSE with the bearer token; reconnects with Last-Event-ID until the signal aborts. */
export async function streamEvents(options: Options): Promise<void> {
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
