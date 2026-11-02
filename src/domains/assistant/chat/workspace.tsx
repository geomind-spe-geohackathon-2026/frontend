import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { Message } from "@/shared/api/types";
import { runQuery, useAnswerRun, useCancelRun, useCreateChat, useSendMessage } from "./api";
import { Composer } from "./composer";
import { Conversation } from "./conversation";
import { RequestCard } from "./request-card";
import { RunPanel } from "./run-panel";
import { useRunView } from "./use-run-view";

type Props = {
  projectId: string;
  chatId: string | null;
  runId: string | null;
  messages: Message[];
};

function toFailure(error: Error | null): string | null {
  return error === null ? null : error.message;
}

/** The conversation and the run panel of one chat, sharing the live view of its last run. */
export function ChatWorkspace({ projectId, chatId, runId, messages }: Props) {
  const navigate = useNavigate();
  const { view, failure } = useRunView(projectId, chatId, runId);
  const run = useQuery({ ...runQuery(projectId, runId ?? ""), enabled: runId !== null });
  const create = useCreateChat(projectId);
  const send = useSendMessage(projectId);
  const answer = useAnswerRun(projectId, runId ?? "");
  const cancel = useCancelRun(projectId, runId ?? "");
  const status = view.blocks.length === 0 && run.data !== undefined ? run.data.status : view.status;
  const active =
    runId !== null && (status === "queued" || status === "running" || status === "waiting");

  async function handleSend(content: string): Promise<void> {
    const target = chatId ?? (await create.mutateAsync({})).id;
    await send.mutateAsync({ chatId: target, content });
    if (chatId === null) void navigate(`/projects/${projectId}/assistant/chat/${target}`);
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-15rem)] min-w-0 flex-col gap-3">
        <div className="flex-1">
          <Conversation messages={messages} liveRunId={runId} view={view} failure={failure} />
        </div>
        {view.request === null || runId === null ? null : (
          <div className="sticky bottom-0">
            <RequestCard
              request={view.request}
              pending={answer.isPending}
              failure={toFailure(answer.error)}
              onAnswer={(value) => {
                answer.mutate({ request: view.request?.request ?? "", answer: value });
              }}
            />
          </div>
        )}
        {send.isError ? (
          <p role="alert" className="text-bad">
            {send.error.message}
          </p>
        ) : null}
        <Composer
          sending={send.isPending || create.isPending}
          active={active}
          cancelling={cancel.isPending}
          onSend={(content) => {
            void handleSend(content);
          }}
          onCancel={() => {
            cancel.mutate();
          }}
        />
      </div>
      {runId === null ? null : (
        <RunPanel projectId={projectId} runId={runId} view={view} run={run.data} />
      )}
    </>
  );
}
