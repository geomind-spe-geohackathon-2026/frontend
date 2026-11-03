import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useReducer } from "react";
import type { ApiError } from "@/shared/api/errors";
import { chatsKey } from "@/shared/sse/chats";
import { streamEvents } from "@/shared/sse/stream";
import type { RunEvent } from "@/shared/sse/types";
import { problemQuery } from "./api";
import { applyEvent, emptyView, loadProblem, type ProblemState, type View } from "./view";

type Action =
  | { kind: "reset" }
  | { kind: "events"; events: RunEvent[] }
  | { kind: "problem"; problem: ProblemState }
  | { kind: "failure"; error: ApiError };

type Stream = { view: View; failure: ApiError | null };

const emptyStream: Stream = { view: emptyView, failure: null };
const batchMs = 80;

function reduceAction(stream: Stream, action: Action): Stream {
  switch (action.kind) {
    case "reset":
      return emptyStream;
    case "events":
      return { ...stream, view: action.events.reduce(applyEvent, stream.view) };
    case "problem":
      return { ...stream, view: loadProblem(stream.view, action.problem) };
    case "failure":
      return { ...stream, failure: action.error };
  }
}

function toBatcher(flush: (events: RunEvent[]) => void) {
  let pending: RunEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    add(event: RunEvent) {
      pending.push(event);
      timer ??= setTimeout(() => {
        timer = null;
        flush(pending);
        pending = [];
      }, batchMs);
    },
    stop() {
      if (timer !== null) clearTimeout(timer);
    },
  };
}

/** Streams a run (replayed from event 0 on every mount) and folds its events into the live view, at most once per batch. */
export function useRunView(projectId: string, chatId: string | null, runId: string | null): Stream {
  const [stream, dispatch] = useReducer(reduceAction, emptyStream);
  const { view } = stream;
  const queryClient = useQueryClient();
  const problem = useQuery({
    ...problemQuery(projectId, chatId ?? ""),
    enabled: chatId !== null,
  });
  const { data, refetch } = problem;

  useEffect(() => {
    if (runId === null) return;
    const controller = new AbortController();
    let finished = false;
    const batch = toBatcher((events) => {
      dispatch({ kind: "events", events });
    });
    dispatch({ kind: "reset" });
    void streamEvents({
      path: `/assistant/runs/${runId}/events`,
      socketPath: `/assistant/runs/${runId}/stream`,
      signal: controller.signal,
      isFinished: () => finished,
      onFailure: (error) => {
        dispatch({ kind: "failure", error });
      },
      onEvent: (event) => {
        batch.add(event);
        if (event.type === "request" || event.type === "run.started") {
          void queryClient.invalidateQueries({ queryKey: chatsKey(projectId) });
        }
        if (event.type !== "run.finished" || event.parent !== null) return;
        finished = true;
        void queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      },
    });
    return () => {
      controller.abort();
      batch.stop();
    };
  }, [runId, projectId, queryClient]);

  useEffect(() => {
    if (data !== undefined)
      dispatch({ kind: "problem", problem: { version: data.version, document: data.state } });
  }, [data]);

  useEffect(() => {
    if (!view.problemStale) return;
    void refetch().then((result) => {
      if (result.data === undefined) return;
      dispatch({
        kind: "problem",
        problem: { version: result.data.version, document: result.data.state },
      });
    });
  }, [view.problemStale, refetch]);

  return stream;
}
