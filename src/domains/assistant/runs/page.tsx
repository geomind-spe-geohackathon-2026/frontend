import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toItems } from "@/shared/api/pagination";
import { PageHeader } from "@/shared/layout/page-header";
import { Quantity } from "@/shared/quantity/quantity";
import { chatsQuery } from "@/shared/sse/chats";
import { ErrorNotice } from "@/shared/sse/notice";
import { RunStatusChip } from "@/shared/sse/status-chip";
import { toDateTimeLabel } from "@/lib/datelabel";
import { toShortId } from "@/lib/shortid";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/shared/ui/button";
import type { Run } from "@/shared/api/types";
import { runsQuery, usageQuery } from "./api";

function Totals({ projectId }: { projectId: string }) {
  const usage = useQuery(usageQuery(projectId));
  if (usage.data === undefined) return null;
  return (
    <p className="text-muted">
      Project total: <Quantity value={usage.data.runs} unit="runs" fractionDigits={0} />
      {" · "}
      <Quantity
        value={usage.data.input_tokens + usage.data.output_tokens}
        unit="tokens"
        fractionDigits={0}
      />
      {" · "}
      <Quantity value={usage.data.cost} unit="USD" fractionDigits={2} />
    </p>
  );
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
    <tr
      className="cursor-pointer border-b border-border last:border-b-0 hover:bg-sunken"
      onClick={() => {
        void navigate(`/projects/${projectId}/assistant/runs/${run.id}`);
      }}
    >
      <td className="px-3 py-2">
        <Link className="text-accent" to={`/projects/${projectId}/assistant/runs/${run.id}`}>
          {toShortId(run.id)}
        </Link>
      </td>
      <td className="px-3 py-2">{title ?? run.chat}</td>
      <td className="px-3 py-2">
        <RunStatusChip status={run.status} />
      </td>
      <td className="px-3 py-2">
        <Quantity
          value={run.usage.input_tokens + run.usage.output_tokens}
          unit=""
          fractionDigits={0}
        />
      </td>
      <td className="px-3 py-2">
        <Quantity value={run.usage.cost} unit="USD" fractionDigits={3} />
      </td>
      <td className="px-3 py-2">
        {run.started === null ? "not started" : toDateTimeLabel(run.started)}
      </td>
    </tr>
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
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Runs of this project, newest first</caption>
        <thead>
          <tr className="text-muted">
            {["Run", "Chat", "Status", "Tokens", "Cost", "Started"].map((name) => (
              <th key={name} scope="col" className="border-b border-border px-3 py-2 font-medium">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((run) => (
            <RunRow key={run.id} projectId={projectId} run={run} title={titles.get(run.chat)} />
          ))}
        </tbody>
      </table>
    </div>
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
      {runs.isPending ? <p className="text-muted">Loading runs</p> : null}
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
