import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { chatsQuery } from "@/shared/sse/chats";
import { ErrorNotice } from "@/shared/sse/notice";
import type { Chat } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";

const ChatDialog = lazy(() =>
  import("./chat-actions").then((module) => ({ default: module.ChatDialog })),
);

type Props = { projectId: string; activeChatId: string | null };

function ChatItem({ projectId, chat, active }: { projectId: string; chat: Chat; active: boolean }) {
  const [mode, setMode] = useState<"rename" | "delete" | null>(null);
  const navigate = useNavigate();
  const base = `/projects/${projectId}/assistant/chat`;
  return (
    <li className={`flex items-center gap-1 rounded-control ${active ? "bg-sunken" : ""}`}>
      <Link
        to={`${base}/${chat.id}`}
        aria-current={active ? "page" : undefined}
        className="min-w-0 flex-1 px-2.5 py-2"
      >
        <span className="block truncate font-medium">{chat.title}</span>
        <span className="text-[12px] text-muted">
          {chat.last_run === null ? "no run yet" : chat.last_run.status}
        </span>
      </Link>
      <Button
        variant="link"
        aria-label={`Rename ${chat.title}`}
        onClick={() => {
          setMode("rename");
        }}
      >
        Rename
      </Button>
      <Button
        variant="link"
        aria-label={`Delete ${chat.title}`}
        onClick={() => {
          setMode("delete");
        }}
      >
        Delete
      </Button>
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
      <Button variant="primary" asChild className="w-full justify-center">
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
