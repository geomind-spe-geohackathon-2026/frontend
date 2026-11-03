import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { chatsQuery } from "@/shared/sse/chats";
import { activeRunsQuery } from "@/shared/api/runs";
import { ErrorNotice } from "@/shared/sse/notice";
import type { Chat } from "@/shared/api/types";
import { Ellipsis } from "lucide-react";
import { toDateLabel } from "@/lib/datelabel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notice } from "@/shared/ui/notice";
import { isPinned, togglePin, usePins } from "@/shared/layout/pins";

const ChatDialog = lazy(() =>
  import("./chat-actions").then((module) => ({ default: module.ChatDialog })),
);

type Props = {
  projectId: string;
  activeChatId: string | null;
  toHref: (chatId: string) => string;
};

const dots: Record<string, string> = {
  running: "bg-muted-foreground animate-pulse",
  approval: "bg-accent",
  waiting: "bg-warn",
  queued: "bg-border",
  done: "bg-ok",
  failed: "bg-bad",
  cancelled: "bg-border",
};

const words: Record<string, string> = {
  approval: "waits for your approval",
  waiting: "needs your input",
};

function useDotState(projectId: string, chat: Chat): string {
  const active = useQuery(activeRunsQuery(projectId));
  const last = chat.last_run;
  if (last === null) return "none";
  if (last.status !== "waiting") return last.status;
  const request = active.data?.items.find((run) => run.id === last.id)?.request;
  return request?.kind === "approval" ? "approval" : "waiting";
}

function ChatMenu({
  title,
  pinned,
  onPin,
  onRename,
  onDelete,
}: {
  title: string;
  pinned: boolean;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover aria-label={`Actions of ${title}`}>
          <Ellipsis aria-hidden="true" />
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        <DropdownMenuItem onClick={onPin}>{pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChatItemDialog({
  projectId,
  chat,
  active,
  mode,
  onClose,
}: {
  projectId: string;
  chat: Chat;
  active: boolean;
  mode: "rename" | "delete" | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  if (mode === null) return null;
  return (
    <Suspense fallback={null}>
      <ChatDialog
        mode={mode}
        projectId={projectId}
        chat={chat}
        onClose={onClose}
        onDeleted={() => {
          if (active) void navigate(`/projects/${projectId}/assistant/chat`);
        }}
      />
    </Suspense>
  );
}

function ChatLink({
  projectId,
  chat,
  active,
  href,
}: {
  projectId: string;
  chat: Chat;
  active: boolean;
  href: string;
}) {
  const { setOpenMobile } = useSidebar();
  const state = useDotState(projectId, chat);
  const status = state === "none" ? "no run yet" : (words[state] ?? state);
  return (
    <SidebarMenuButton asChild isActive={active} className="h-auto py-1.5">
      <Link
        to={href}
        aria-current={active ? "page" : undefined}
        title={`${chat.title} · ${status} · ${toDateLabel(chat.created)}`}
        className="text-sidebar-foreground no-underline"
        onClick={() => {
          setOpenMobile(false);
        }}
      >
        <span
          aria-hidden="true"
          className={`size-2 flex-none rounded-full ${dots[state] ?? "bg-border"}`}
        />
        <span className="min-w-0 flex-1 truncate">{chat.title}</span>
        <span className="sr-only">
          {status} · {toDateLabel(chat.created)}
        </span>
      </Link>
    </SidebarMenuButton>
  );
}

function ChatItem({
  projectId,
  chat,
  active,
  href,
}: {
  projectId: string;
  chat: Chat;
  active: boolean;
  href: string;
}) {
  const [mode, setMode] = useState<"rename" | "delete" | null>(null);
  const pins = usePins();
  return (
    <SidebarMenuItem>
      <ChatLink projectId={projectId} chat={chat} active={active} href={href} />
      <ChatMenu
        title={chat.title}
        pinned={isPinned(pins, "chat", chat.id)}
        onPin={() => {
          togglePin({ kind: "chat", id: chat.id, projectId, title: chat.title });
        }}
        onRename={() => {
          setMode("rename");
        }}
        onDelete={() => {
          setMode("delete");
        }}
      />
      <ChatItemDialog
        projectId={projectId}
        chat={chat}
        active={active}
        mode={mode}
        onClose={() => {
          setMode(null);
        }}
      />
    </SidebarMenuItem>
  );
}

/** The chats of the project in the sidebar, newest first, each with Pin, Rename and Delete. */
export function ChatList({ projectId, activeChatId, toHref }: Props) {
  const chats = useQuery(chatsQuery(projectId));
  return (
    <nav aria-label="Chats">
      {chats.isPending ? <Notice status="loading" what="chats" /> : null}
      {chats.isError ? <ErrorNotice error={chats.error} what="The chats" /> : null}
      {chats.data?.length === 0 ? <p className="px-2 text-muted">No chats yet.</p> : null}
      <SidebarMenu>
        {(chats.data ?? []).map((chat) => (
          <ChatItem
            key={chat.id}
            projectId={projectId}
            chat={chat}
            active={chat.id === activeChatId}
            href={toHref(chat.id)}
          />
        ))}
      </SidebarMenu>
    </nav>
  );
}
