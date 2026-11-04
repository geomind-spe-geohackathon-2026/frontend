import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Message } from "@/shared/api/types";
import { runQuery, useAnswerRun, useCancelRun, useCreateChat, useSendMessage } from "./api";
import { AddToCase } from "./add-to-case";
import { Composer } from "./composer";
import { CaseNotice, DemoNotice } from "./demo-notice";
import { Conversation } from "./conversation";
import { RequestCard } from "./request-card";
import { ChatStatus } from "./chat-status";
import { PanelHints } from "./panel-hints";
import { AutoApproveButton, useApproveByItself, useAutoApprove } from "./auto-approve";
import { useRunView } from "./use-run-view";
import type { View } from "./view";

type Props = {
  projectId: string;
  chatId: string | null;
  runId: string | null;
  messages: Message[];
};

const caseTools = new Set(["save_profile", "set_case", "accept_case"]);

function toSavedProfile(view: View): boolean {
  return view.blocks.some(
    (block) => block.kind === "tool" && caseTools.has(block.tool) && block.state === "done",
  );
}

function SavedProfile({
  projectId,
  chatId,
  view,
}: {
  projectId: string;
  chatId: string | null;
  view: View;
}) {
  if (chatId === null || !toSavedProfile(view)) return null;
  return <AddToCase projectId={projectId} chatId={chatId} />;
}

function SendFailure({ error }: { error: Error }) {
  return (
    <p role="alert" className="text-bad">
      {error.message}
    </p>
  );
}

function toFailure(error: Error | null): string | null {
  return error === null ? null : error.message;
}

type RequestProps = { projectId: string; runId: string; view: View; auto: boolean };

function RunRequest({ projectId, runId, view, auto }: RequestProps) {
  const answer = useAnswerRun(projectId, runId);
  useApproveByItself(auto, view.request, (request) => {
    answer.mutate({ request, answer: { approved: true } });
  });
  if (view.request === null || (auto && view.request.kind === "approval")) return null;
  const { request } = view;
  return (
    <div className="sticky bottom-0">
      <RequestCard
        request={request}
        pending={answer.isPending}
        failure={toFailure(answer.error)}
        onAnswer={(value) => {
          answer.mutate({ request: request.request, answer: value });
        }}
      />
    </div>
  );
}

function useStop(projectId: string, runId: string | null, active: boolean) {
  const cancel = useCancelRun(projectId, runId ?? "");
  const [asked, setAsked] = useState<string | null>(null);
  const stop = () => {
    cancel.mutate(undefined, {
      onSuccess: () => {
        setAsked(runId);
      },
    });
  };
  const stopping = cancel.isPending || (active && asked !== null && asked === runId);
  return { stop, stopping, error: cancel.error };
}

/** The conversation of one chat and its message box, whose log window shares the live view of the last run. */
export function ChatWorkspace({ projectId, chatId, runId, messages }: Props) {
  const navigate = useNavigate();
  const { view, failure } = useRunView(projectId, chatId, runId);
  const run = useQuery({ ...runQuery(projectId, runId ?? ""), enabled: runId !== null });
  const create = useCreateChat(projectId);
  const send = useSendMessage(projectId);
  const [auto, setAuto] = useAutoApprove(projectId);
  const status = view.blocks.length === 0 && run.data !== undefined ? run.data.status : view.status;
  const active =
    runId !== null && (status === "queued" || status === "running" || status === "waiting");
  const stop = useStop(projectId, runId, active);

  async function handleSend(content: string): Promise<void> {
    const target = chatId ?? (await create.mutateAsync({})).id;
    await send.mutateAsync({ chatId: target, content });
    if (chatId === null) void navigate(`/projects/${projectId}/assistant/chat/${target}`);
  }

  return (
    <div className="flex h-full min-h-[420px] min-w-0 flex-col gap-3">
      <DemoNotice />
      <CaseNotice projectId={projectId} />
      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation
          projectId={projectId}
          chatId={chatId}
          onSuggest={(content) => {
            if (!active) void handleSend(content);
          }}
          messages={messages}
          liveRunId={runId}
          view={view}
          failure={failure}
        />
      </div>
      <SavedProfile projectId={projectId} chatId={chatId} view={view} />
      <PanelHints projectId={projectId} chatId={chatId} view={view} />
      {runId === null ? null : (
        <RunRequest projectId={projectId} runId={runId} view={view} auto={auto} />
      )}
      {send.isError ? <SendFailure error={send.error} /> : null}
      {stop.error === null ? null : <SendFailure error={stop.error} />}
      <Composer
        projectId={projectId}
        sending={send.isPending || create.isPending}
        active={active}
        cancelling={stop.stopping}
        onSend={(content) => {
          void handleSend(content);
        }}
        onCancel={stop.stop}
        status={
          <>
            <AutoApproveButton on={auto} onChange={setAuto} />
            <ChatStatus {...{ projectId, chatId, runId, view }} />
          </>
        }
      />
    </div>
  );
}
