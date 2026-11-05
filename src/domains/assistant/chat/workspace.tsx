import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Message } from "@/shared/api/types";
import { runQuery, useAnswerRun, useCancelRun, useCreateChat, useSendMessage } from "./api";
import { Composer } from "./composer";
import { CaseNotice, DemoNotice } from "./demo-notice";
import { Conversation } from "./conversation";
import { RequestCard } from "./request-card";
import { ChatStatus } from "./chat-status";
import { PanelHints } from "./panel-hints";
import { AutoApproveButton, saveAutoApprove, useApproveByItself, useAutoApprove } from "./auto-approve";
import { useRunView } from "./use-run-view";
import { keepAnswer } from "./answers";
import { toMessageWithFiles } from "@/shared/attach/upload";
import { useAttachments } from "@/shared/attach/use-attachments";
import type { View } from "./view";

type Props = {
  projectId: string;
  chatId: string | null;
  runId: string | null;
  messages: Message[];
};

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
  const shown = useRef<string | null>(null);
  const toInView = (element: HTMLDivElement | null, id: string) => {
    if (element === null || shown.current === id) return;
    shown.current = id;
    requestAnimationFrame(() => {
      element.scrollIntoView({ block: "end" });
    });
  };
  useApproveByItself(auto, view.request, (request) => {
    keepAnswer(request, { approved: true });
    answer.mutate({ request, answer: { approved: true } });
  });
  if (view.request === null || (auto && view.request.kind === "approval")) return null;
  const { request } = view;
  return (
    <div
      className="max-h-[45svh] min-h-0 shrink-0 overflow-y-auto overscroll-contain"
      ref={(element) => toInView(element, request.request)}
    >
      <RequestCard
        request={request}
        pending={answer.isPending}
        failure={toFailure(answer.error)}
        onAnswer={(value) => {
          keepAnswer(request.request, value);
          answer.mutate({ request: request.request, answer: value });
        }}
      />
    </div>
  );
}

function isUnfinished(status: string | undefined): boolean {
  return status === "queued" || status === "running" || status === "waiting";
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

function useSendToChat(projectId: string, chatId: string | null, auto: boolean) {
  const navigate = useNavigate();
  const create = useCreateChat(projectId);
  const send = useSendMessage(projectId);
  async function handleSend(content: string): Promise<void> {
    const target = chatId ?? (await create.mutateAsync({})).id;
    if (chatId === null && auto) await saveAutoApprove(target, true);
    await send.mutateAsync({ chatId: target, content });
    if (chatId === null) void navigate(`/projects/${projectId}/assistant/chat/${target}`);
  }
  return { handleSend, send, pending: send.isPending || create.isPending };
}

/** The conversation of one chat and its message box, whose log window shares the live view of the last run. */
export function ChatWorkspace({ projectId, chatId, runId, messages }: Props) {
  const { view, failure } = useRunView(projectId, chatId, runId);
  const run = useQuery({ ...runQuery(projectId, runId ?? ""), enabled: runId !== null });
  const [auto, setAuto] = useAutoApprove(chatId);
  const { handleSend, send, pending } = useSendToChat(projectId, chatId, auto);
  const files = useAttachments(projectId);
  const status = view.blocks.length === 0 && run.data !== undefined ? run.data.status : view.status;
  const active = runId !== null && (isUnfinished(status) || isUnfinished(run.data?.status));
  const stop = useStop(projectId, runId, active);

  return (
    <div className="flex h-full min-h-[420px] min-w-0 flex-col gap-3">
      <DemoNotice />
      <CaseNotice projectId={projectId} />
      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation
          projectId={projectId}
          chatId={chatId}
          onSuggest={(content) => {
            if (active || files.reading) return;
            void handleSend(toMessageWithFiles(content, files.names));
            files.clear();
          }}
          messages={messages}
          liveRunId={runId}
          view={view}
          failure={failure}
        />
      </div>
      <PanelHints projectId={projectId} chatId={chatId} view={view} />
      {runId === null ? null : (
        <RunRequest projectId={projectId} runId={runId} view={view} auto={auto} />
      )}
      {send.isError ? <SendFailure error={send.error} /> : null}
      {stop.error === null ? null : <SendFailure error={stop.error} />}
      <Composer
        projectId={projectId}
        sending={pending}
        active={active}
        cancelling={stop.stopping}
        onSend={(content) => {
          void handleSend(content);
        }}
        onCancel={stop.stop}
        files={files}
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
