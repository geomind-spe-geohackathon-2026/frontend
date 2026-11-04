import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { streamEvents } from "@/shared/sse/stream";
import type { RunEvent } from "@/shared/sse/types";
import { Blocks } from "./blocks";
import { applyEvent, emptyView, type View } from "./view";

const batchMs = 120;

function useReplay(runId: string): { view: View; failed: boolean } {
  const [view, setView] = useState<View>(emptyView);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let finished = false;
    let pending: RunEvent[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      timer = null;
      const events = pending;
      pending = [];
      setView((current) => events.reduce(applyEvent, current));
    };
    void streamEvents({
      path: `/assistant/runs/${runId}/events`,
      signal: controller.signal,
      isFinished: () => finished,
      onFailure: () => {
        setFailed(true);
      },
      onEvent: (event) => {
        pending.push(event);
        timer ??= setTimeout(flush, batchMs);
        if (event.type === "run.finished" && event.parent === null) finished = true;
      },
    });
    return () => {
      controller.abort();
      if (timer !== null) clearTimeout(timer);
    };
  }, [runId]);
  return { view, failed };
}

function Replay({ runId }: { runId: string }) {
  const { view, failed } = useReplay(runId);
  if (failed) return <p className="text-bad">The steps of this run could not be loaded.</p>;
  if (view.blocks.length === 0) return <p className="text-muted">Loading the steps...</p>;
  return <Blocks blocks={view.blocks} running={false} />;
}

/** An earlier run of the chat that ended without an answer (cancelled or failed): its steps on demand, and a link to its log. */
export function PastRun({ projectId, runId }: { projectId: string; runId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="space-y-1.5 text-[12.5px]"
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className="cursor-pointer text-muted">
        This run ended without an answer. Show its steps
      </summary>
      {open ? <Replay runId={runId} /> : null}
      <Link to={`/projects/${projectId}/assistant/runs/${runId}`} className="underline">
        Open it in Runs and logs
      </Link>
    </details>
  );
}
