import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { nextStepsOf, type NextStep } from "@/shared/sse/next-steps";
import { chatSuggestionsQuery } from "./api";
import {
  Conversation as Log,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import type { ApiError } from "@/shared/api/errors";
import type { Message as ChatMessage } from "@/shared/api/types";
import { Blocks, finishTool } from "./blocks";
import { MessageButtons } from "./message-actions";
import { PastRun } from "./past-run";
import { MarkdownText } from "@/shared/ui/markdown-text";
import { PacedMarkdown } from "./paced-markdown";
import type { View } from "./view";

type Props = {
  projectId: string;
  chatId: string | null;
  onSuggest: (message: string) => void;
  messages: ChatMessage[];
  liveRunId: string | null;
  view: View;
  failure: ApiError | null;
};

function isFinish(block: View["blocks"][number]): boolean {
  return block.kind === "tool" && block.tool === finishTool;
}

function isActive(view: View): boolean {
  return view.status === "queued" || view.status === "running" || view.status === "waiting";
}

function UserBubble({ projectId, message }: { projectId: string; message: ChatMessage }) {
  return (
    <Message from="user" className="gap-1">
      <MessageContent className="text-[length:inherit] whitespace-pre-wrap">
        {message.content}
      </MessageContent>
      <MessageButtons projectId={projectId} message={message} />
    </Message>
  );
}

function NextSteps({
  steps,
  onSuggest,
}: {
  steps: NextStep[];
  onSuggest: (message: string) => void;
}) {
  if (steps.length === 0) return null;
  return (
    <Suggestions aria-label="Suggested next steps">
      {steps.map((step) => (
        <Suggestion
          key={step.label}
          suggestion={step.message}
          title={step.message}
          onClick={onSuggest}
        >
          {step.label}
        </Suggestion>
      ))}
    </Suggestions>
  );
}

function toLastSteps(messages: ChatMessage[], liveRunId: string | null, view: View): NextStep[] {
  const last = messages.at(-1);
  if (last?.role !== "assistant") return [];
  if (last.run !== null && last.run === liveRunId && view.suggestions.length > 0) {
    return view.suggestions;
  }
  return nextStepsOf(last);
}

function EmptyChat({
  projectId,
  chatId,
  onSuggest,
}: Pick<Props, "projectId" | "chatId" | "onSuggest">) {
  const steps = useQuery(chatSuggestionsQuery(projectId, chatId));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted">
        New chat. Add files, say what you need, and the assistant takes it from there.
      </p>
      <NextSteps steps={steps.data ?? []} onSuggest={onSuggest} />
    </div>
  );
}

/** The messages of a chat; the run being shown live draws its blocks under its user message. */
export function Conversation({
  projectId,
  chatId,
  onSuggest,
  messages,
  liveRunId,
  view,
  failure,
}: Props) {
  const [known] = useState(() => new Set(messages.map((message) => message.id)));
  const answered = new Set(
    messages.flatMap((message) =>
      message.role === "assistant" && message.run !== null ? [message.run] : [],
    ),
  );

  if (messages.length === 0) {
    return <EmptyChat projectId={projectId} chatId={chatId} onSuggest={onSuggest} />;
  }
  return (
    <Log className="min-h-0" aria-busy={isActive(view)}>
      <ConversationContent className="gap-3 p-0 pr-1">
        {messages.map((message) => {
          const isLive = message.run !== null && message.run === liveRunId;
          if (message.role === "assistant") {
            const shown = !isLive || view.blocks.some(isFinish);
            if (!shown) return null;
            return (
              <Message key={message.id} from="assistant" className="gap-1">
                <MessageContent className="w-full text-[length:inherit]">
                  {known.has(message.id) ? (
                    <MarkdownText text={message.content} />
                  ) : (
                    <PacedMarkdown text={message.content} settled={0} open={false} />
                  )}
                </MessageContent>
                <MessageButtons projectId={projectId} message={message} />
              </Message>
            );
          }
          return (
            <div key={message.id} className="space-y-3">
              <UserBubble projectId={projectId} message={message} />
              {isLive ? <Blocks blocks={view.blocks} running={isActive(view)} /> : null}
              {!isLive && message.run !== null && !answered.has(message.run) ? (
                <PastRun projectId={projectId} runId={message.run} />
              ) : null}
            </div>
          );
        })}
        {isActive(view) ? null : (
          <NextSteps steps={toLastSteps(messages, liveRunId, view)} onSuggest={onSuggest} />
        )}
        {failure === null ? null : (
          <p role="alert" className="text-bad">
            The live stream stopped ({failure.code}). Reload the page to continue.
          </p>
        )}
      </ConversationContent>
      <ConversationScrollButton aria-label="Scroll to the newest message" />
    </Log>
  );
}
