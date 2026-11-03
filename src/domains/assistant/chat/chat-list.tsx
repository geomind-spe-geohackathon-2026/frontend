import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { chatsQuery } from "@/shared/sse/chats";
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

const ChatDialog = lazy(() =>
  import("./chat-actions").then((module) => ({ default: module.ChatDialog })),
);

type Props = {
  projectId: string;
  activeChatId: string | null;
  toHref: (chatId: string) => string;
};

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
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover aria-label={`Actions of ${title}`}>
          <Ellipsis aria-hidden="true" />
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
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
  const { setOpenMobile } = useSidebar();
  const status = chat.last_run === null ? "no run yet" : chat.last_run.status;
  return (
    <SidebarMenuItem>
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
            className={`size-2 flex-none rounded-full ${dots[chat.last_run?.status ?? "none"] ?? "bg-border"}`}
          />
          <span className="min-w-0 flex-1 truncate">{chat.title}</span>
          <span className="sr-only">
            {status} · {toDateLabel(chat.created)}
          </span>
        </Link>
      </SidebarMenuButton>
      <ChatMenu
        title={chat.title}
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

/** The chats of the project in the sidebar, newest first, like recent conversations. */
export function ChatList({ projectId, activeChatId, toHref }: Props) {
  const chats = useQuery(chatsQuery(projectId));
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
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
    </SidebarGroup>
  );
}
