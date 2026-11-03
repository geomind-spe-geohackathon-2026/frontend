import { useEffect, useRef, useState } from "react";
import type { ApiError } from "@/shared/api/errors";
import type { Message } from "@/shared/api/types";
import { Blocks, finishTool } from "./blocks";
import { MarkdownText } from "@/shared/ui/markdown-text";
import { PacedMarkdown } from "./paced-markdown";
import type { View } from "./view";

type Props = {
  messages: Message[];
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

function UserBubble({ content }: { content: string }) {
  return <p className="rounded-card bg-accent-soft px-3 py-2 whitespace-pre-wrap">{content}</p>;
}

const followMarginPx = 160;

function useFollowEnd(end: React.RefObject<HTMLDivElement | null>, count: number) {
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (count > 0) end.current?.scrollIntoView({ block: "end" });
  }, [count, end]);
  useEffect(() => {
    if (content.current === null) return;
    const observer = new ResizeObserver(() => {
      const top = end.current?.getBoundingClientRect().top ?? Infinity;
      if (top <= window.innerHeight + followMarginPx) end.current?.scrollIntoView({ block: "end" });
    });
    observer.observe(content.current);
    return () => {
      observer.disconnect();
    };
  }, [end]);
  return content;
}

/** The messages of a chat; the run being shown live draws its blocks under its user message. */
export function Conversation({ messages, liveRunId, view, failure }: Props) {
  const end = useRef<HTMLDivElement>(null);
  const content = useFollowEnd(end, view.blocks.length);
  const [known] = useState(() => new Set(messages.map((message) => message.id)));

  if (messages.length === 0) {
    return (
      <p className="text-muted">
        New chat. Add files, say what you need, and the assistant takes it from there.
      </p>
    );
  }
  return (
    <div ref={content} className="space-y-3" aria-live="polite" aria-busy={isActive(view)}>
      {messages.map((message) => {
        const isLive = message.run !== null && message.run === liveRunId;
        if (message.role === "assistant") {
          const shown = !isLive || view.blocks.some(isFinish);
          if (!shown) return null;
          if (known.has(message.id))
            return <MarkdownText key={message.id} text={message.content} />;
          return <PacedMarkdown key={message.id} text={message.content} settled={0} open={false} />;
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
