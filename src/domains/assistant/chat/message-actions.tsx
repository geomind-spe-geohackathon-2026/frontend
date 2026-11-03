import { useState } from "react";
import { Check, Copy, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MessageAction, MessageActions } from "@/components/ai-elements/message";
import { toDateTimeLabel } from "@/lib/datelabel";
import type { Message } from "@/shared/api/types";

function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <MessageAction
      tooltip={copied ? "Copied" : "Copy"}
      className="size-7 text-muted-foreground"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(
          () => {
            setCopied(true);
            window.setTimeout(() => {
              setCopied(false);
            }, 1500);
          },
          () => {
            toast("Copy failed");
          },
        );
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </MessageAction>
  );
}

/** Like Claude's: quiet buttons under a message, shown on hover or focus; copy for every message, the time, and the run log under answers. */
export function MessageButtons({ projectId, message }: { projectId: string; message: Message }) {
  const isUser = message.role === "user";
  return (
    <MessageActions
      className={`opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 ${isUser ? "justify-end" : ""}`}
    >
      {isUser ? (
        <time dateTime={message.created} className="px-1 text-[12px] text-muted-foreground">
          {toDateTimeLabel(message.created)}
        </time>
      ) : null}
      <CopyAction text={message.content} />
      {isUser || message.run === null ? null : (
        <Button asChild variant="ghost" size="icon-sm" className="size-7 text-muted-foreground">
          <Link
            to={`/projects/${projectId}/assistant/runs/${message.run}`}
            aria-label="Log of this run"
            title="Log of this run"
          >
            <ScrollText aria-hidden="true" />
          </Link>
        </Button>
      )}
    </MessageActions>
  );
}
