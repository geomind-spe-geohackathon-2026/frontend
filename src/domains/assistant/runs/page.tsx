import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toItems } from "@/shared/api/pagination";
import { PageHeader } from "@/shared/layout/page-header";
import { Quantity } from "@/shared/quantity/quantity";
import { Tokens } from "@/shared/quantity/usage";
import { chatsQuery } from "@/shared/sse/chats";
import { ErrorNotice } from "@/shared/sse/notice";
import { RunStatusChip } from "@/shared/sse/status-chip";
import { toDateTimeLabel } from "@/lib/datelabel";
import { toShortId } from "@/lib/shortid";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/components/ui/button";
import type { Run } from "@/shared/api/types";
import { runsQuery, usageQuery } from "./api";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Notice } from "@/shared/ui/notice";
import { DataCell, DataTableFrame, dataTableClass } from "@/shared/ui/data-table";

function Totals({ projectId }: { projectId: string }) {
  const usage = useQuery(usageQuery(projectId));
  if (usage.data === undefined) return null;
  return (
    <p className="text-muted">
      Project total: <Quantity value={usage.data.runs} unit="runs" fractionDigits={0} />
      {" · "}
      <Tokens value={usage.data.input_tokens + usage.data.output_tokens} unit="tokens" />
      {" · "}
      <Quantity value={usage.data.cost} unit="USD" fractionDigits={2} />
    </p>
  );
}

function toPrompt(run: object): string | null {
  if (!("prompt" in run) || typeof run.prompt !== "string" || run.prompt.trim() === "") return null;
  return run.prompt.length > 120 ? `${run.prompt.slice(0, 120)}…` : run.prompt;
}

function RunRow({
  projectId,
  run,
  title,
}: {
  projectId: string;
  run: Run;
  title: string | undefined;
}) {
  const navigate = useNavigate();
  return (
    <TableRow
      className="cursor-pointer border-b border-border last:border-b-0 hover:bg-sunken"
      onClick={() => {
        void navigate(`/projects/${projectId}/assistant/runs/${run.id}`);
      }}
    >
      <TableCell className="px-3 py-2">
        <Link className="text-accent" to={`/projects/${projectId}/assistant/runs/${run.id}`}>
          {toShortId(run.id)}
        </Link>
      </TableCell>
      <DataCell className="px-3">
        <span className="line-clamp-2">{toPrompt(run) ?? title ?? run.chat}</span>
        {toPrompt(run) === null ? null : (
          <span className="block text-[12px] text-muted">{title ?? run.chat}</span>
        )}
      </DataCell>
      <TableCell className="px-3 py-2">
        <RunStatusChip status={run.status} />
      </TableCell>
      <TableCell className="px-3 py-2">
        <Tokens value={run.usage.input_tokens + run.usage.output_tokens} />
      </TableCell>
      <TableCell className="px-3 py-2">
        <Quantity value={run.usage.cost} unit="USD" fractionDigits={3} />
      </TableCell>
      <TableCell className="px-3 py-2">
        {run.started === null ? "not started" : toDateTimeLabel(run.started)}
      </TableCell>
    </TableRow>
  );
}

function RunsTable({
  projectId,
  items,
  titles,
}: {
  projectId: string;
  items: Run[];
  titles: Map<string, string>;
}) {
  return (
    <DataTableFrame className="max-h-[70vh]">
        <TableCaption className="sr-only">Runs of this project, newest first</TableCaption>
        <TableHeader className={dataTableClass.header}>
          <TableRow className="text-muted">
            {["Run", "Chat", "Status", "Tokens", "Cost", "Started"].map((name) => (
              <TableHead
                key={name}
                scope="col"
                className="border-b border-border px-3 py-2 font-medium"
              >
                {name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((run) => (
            <RunRow key={run.id} projectId={projectId} run={run} title={titles.get(run.chat)} />
          ))}
        </TableBody>
      </DataTableFrame>
  );
}

/** The runs of a project with status, tokens and cost; a run opens its log. */
export function RunsPage() {
  const projectId = useRequiredParam("projectId");
  const runs = useInfiniteQuery(runsQuery(projectId));
  const chats = useQuery(chatsQuery(projectId));
  const items = toItems(runs.data?.pages);
  const titles = new Map((chats.data ?? []).map((chat) => [chat.id, chat.title]));

  return (
    <>
      <PageHeader
        title="Runs and logs"
        description="Every answer the assistant gave in this project, with tokens and cost."
        actions={<Totals projectId={projectId} />}
      />
      {runs.isPending ? <Notice status="loading" what="runs" /> : null}
      {runs.isError ? <ErrorNotice error={runs.error} what="The runs" /> : null}
      {runs.isSuccess && items.length === 0 ? (
        <p className="text-muted">No runs yet. Ask the assistant in a chat to start one.</p>
      ) : null}
      {items.length === 0 ? null : (
        <RunsTable projectId={projectId} items={items} titles={titles} />
      )}
      {runs.hasNextPage ? (
        <Button
          className="mt-3"
          disabled={runs.isFetchingNextPage}
          onClick={() => {
            void runs.fetchNextPage();
          }}
        >
          Load more
        </Button>
      ) : null}
    </>
  );
}
