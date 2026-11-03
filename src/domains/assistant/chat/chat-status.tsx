import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toShortId } from "@/lib/shortid";
import { toDateLabel } from "@/lib/datelabel";
import type { Run } from "@/shared/api/types";
import { RunStatusChip } from "@/shared/sse/status-chip";
import { UsageLine } from "@/shared/sse/usage-line";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chatRunsQuery } from "./api";
import { RunPanel } from "./run-panel";
import { UsageRing } from "./usage-ring";
import type { View } from "./view";

type Props = {
  projectId: string;
  chatId: string | null;
  runId: string | null;
  view: View;
  run: Run | undefined;
};

function toTotalCost(runs: Run[] | undefined, live: View, runId: string | null): number {
  const others = (runs ?? []).filter((run) => run.id !== runId);
  const done = others.reduce((sum, run) => sum + run.usage.cost, 0);
  return done + live.usage.cost;
}

function RunsTable({ projectId, runs }: { projectId: string; runs: Run[] }) {
  if (runs.length === 0) return null;
  return (
    <Table>
      <TableCaption className="sr-only">Runs of this chat</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Run</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Started</TableHead>
          <TableHead scope="col">Tokens and cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell>
              <Link to={`/projects/${projectId}/assistant/runs/${run.id}`}>
                {toShortId(run.id)}
              </Link>
            </TableCell>
            <TableCell>
              <RunStatusChip status={run.status} />
            </TableCell>
            <TableCell>{run.started === null ? "-" : toDateLabel(run.started)}</TableCell>
            <TableCell>
              <UsageLine usage={run.usage} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Under the message box: a ring like Claude's that opens what this chat used, and from there this chat's log in a large window. */
export function ChatStatus({ projectId, chatId, runId, view, run }: Props) {
  const runs = useQuery({ ...chatRunsQuery(projectId, chatId ?? ""), enabled: chatId !== null });
  const [logOpen, setLogOpen] = useState(false);
  if (chatId === null) return null;
  return (
    <>
      <UsageRing
        context={view.context}
        window={null}
        usage={view.usage}
        cost={toTotalCost(runs.data, view, runId)}
        onOpenLog={() => {
          setLogOpen(true);
        }}
      />
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="flex h-[calc(100svh-4rem)] max-w-[calc(100vw-4rem)] flex-col sm:max-w-[calc(100vw-4rem)]">
          <DialogHeader>
            <DialogTitle>Log of this chat</DialogTitle>
            <DialogDescription>
              The last run, what the assistant knows, and every run with its tokens and cost.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {runId === null ? (
              <p className="text-muted">No run yet.</p>
            ) : (
              <RunPanel projectId={projectId} runId={runId} view={view} run={run} />
            )}
            <RunsTable projectId={projectId} runs={runs.data ?? []} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
