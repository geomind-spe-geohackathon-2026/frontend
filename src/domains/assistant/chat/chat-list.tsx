import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { chatsQuery } from "@/shared/sse/chats";
import { ErrorNotice } from "@/shared/sse/notice";
import type { Chat } from "@/shared/api/types";
import { Ellipsis } from "lucide-react";
import { toDateLabel } from "@/lib/datelabel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ChatDialog = lazy(() =>
  import("./chat-actions").then((module) => ({ default: module.ChatDialog })),
);

type Props = { projectId: string; activeChatId: string | null };

const dots: Record<string, string> = {
  running: "bg-accent",
  waiting: "bg-warn",
  queued: "bg-border",
  done: "bg-ok",
  failed: "bg-bad",
  cancelled: "bg-border",
};

function ChatMenu({
  title,
  onRename,
  onDelete,
}: {
  title: string;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions of ${title}`}
        className="mt-1.5 rounded-control p-1 text-muted hover:bg-surface"
      >
        <Ellipsis aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChatItem({ projectId, chat, active }: { projectId: string; chat: Chat; active: boolean }) {
  const [mode, setMode] = useState<"rename" | "delete" | null>(null);
  const navigate = useNavigate();
  const base = `/projects/${projectId}/assistant/chat`;
  return (
    <li
      className={`group relative flex items-start gap-1 rounded-control ${active ? "bg-sunken" : ""}`}
    >
      <Link
        to={`${base}/${chat.id}`}
        aria-current={active ? "page" : undefined}
        className="min-w-0 flex-1 px-2.5 py-2 text-text no-underline"
      >
        <span className="line-clamp-2 font-medium" title={chat.title}>
          {chat.title}
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${dots[chat.last_run?.status ?? "none"] ?? "bg-border"}`}
          />
          {chat.last_run === null ? "no run yet" : chat.last_run.status} ·{" "}
          {toDateLabel(chat.created)}
        </span>
      </Link>
      <ChatMenu
        title={chat.title}
        onRename={() => {
          setMode("rename");
        }}
        onDelete={() => {
          setMode("delete");
        }}
      />
      {mode === null ? null : (
        <Suspense fallback={null}>
          <ChatDialog
            mode={mode}
            projectId={projectId}
            chat={chat}
            onClose={() => {
              setMode(null);
            }}
            onDeleted={() => {
              if (active) void navigate(base);
            }}
          />
        </Suspense>
      )}
    </li>
  );
}

/** The left column of the chat page: new chat and the chats of the project, newest first. */
export function ChatList({ projectId, activeChatId }: Props) {
  const chats = useQuery(chatsQuery(projectId));
  return (
    <nav aria-label="Chats" className="space-y-2">
      <Button variant="default" asChild className="w-full justify-center">
        <Link to={`/projects/${projectId}/assistant/chat?new`}>+ New chat</Link>
      </Button>
      {chats.isPending ? <p className="text-muted">Loading chats</p> : null}
      {chats.isError ? <ErrorNotice error={chats.error} what="The chats" /> : null}
      {chats.data?.length === 0 ? <p className="text-muted">No chats yet.</p> : null}
      <ul className="space-y-1">
        {(chats.data ?? []).map((chat) => (
          <ChatItem
            key={chat.id}
            projectId={projectId}
            chat={chat}
            active={chat.id === activeChatId}
          />
        ))}
      </ul>
    </nav>
  );
}
