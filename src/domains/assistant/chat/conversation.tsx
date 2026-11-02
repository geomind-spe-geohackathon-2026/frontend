import { useEffect, useRef } from "react";
import type { ApiError } from "@/shared/api/errors";
import type { Message } from "@/shared/api/types";
import { Blocks } from "./blocks";
import { MarkdownText } from "@/shared/ui/markdown-text";
import type { View } from "./view";

type Props = {
  messages: Message[];
  liveRunId: string | null;
  view: View;
  failure: ApiError | null;
};

function isActive(view: View): boolean {
  return view.status === "queued" || view.status === "running" || view.status === "waiting";
}

function UserBubble({ content }: { content: string }) {
  return <p className="rounded-card bg-accent-soft px-3 py-2 whitespace-pre-wrap">{content}</p>;
}

/** The messages of a chat; the run being shown live draws its blocks under its user message. */
export function Conversation({ messages, liveRunId, view, failure }: Props) {
  const end = useRef<HTMLDivElement>(null);
  const count = view.blocks.length;
  useEffect(() => {
    if (count > 0) end.current?.scrollIntoView({ block: "end" });
  }, [count]);

  if (messages.length === 0) {
    return <p className="text-muted">New chat. Ask anything about this project.</p>;
  }
  return (
    <div className="space-y-3" aria-live="polite">
      {messages.map((message) => {
        const isLive = message.run !== null && message.run === liveRunId;
        if (message.role === "assistant") {
          return isLive ? null : <MarkdownText key={message.id} text={message.content} />;
        }
        return (
          <div key={message.id} className="space-y-3">
            <UserBubble content={message.content} />
            {isLive ? <Blocks blocks={view.blocks} running={isActive(view)} /> : null}
          </div>
        );
      })}
      {failure === null ? null : (
        <p role="alert" className="text-bad">
          The live stream stopped ({failure.code}). Reload the page to continue.
        </p>
      )}
      <div ref={end} />
    </div>
  );
}
