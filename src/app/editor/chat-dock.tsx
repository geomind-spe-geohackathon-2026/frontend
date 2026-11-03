import { useQuery } from "@tanstack/react-query";
import { messagesQuery, useCreateChat } from "@/domains/assistant/chat/api";
import { ChatWorkspace } from "@/domains/assistant/chat/workspace";
import type { Chat } from "@/shared/api/types";
import { chatsQuery } from "@/shared/sse/chats";
import { ErrorNotice } from "@/shared/sse/notice";
import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";

type Props = { projectId: string; chatId: string | null; onChat: (chatId: string) => void };

function DockBody({ projectId, chatId }: { projectId: string; chatId: string }) {
  const messages = useQuery(messagesQuery(projectId, chatId));
  if (messages.isPending) return <p className="text-muted">Loading messages</p>;
  if (messages.isError) return <ErrorNotice error={messages.error} what="The chat" />;
  const runId = messages.data.findLast((message) => message.run !== null)?.run ?? null;
  return (
    <div className="flex flex-col gap-3">
      <ChatWorkspace
        key={`${chatId}/${runId ?? ""}`}
        projectId={projectId}
        chatId={chatId}
        runId={runId}
        messages={messages.data}
      />
    </div>
  );
}

function ChatPicker({
  chats,
  value,
  onChat,
}: {
  chats: Chat[];
  value: string;
  onChat: (chatId: string) => void;
}) {
  return (
    <select
      aria-label="Chat"
      value={value}
      onChange={(event) => {
        onChat(event.target.value);
      }}
      className="min-w-0 flex-1 rounded-control border border-border bg-surface px-2 py-[5px]"
    >
      {chats.map((chat) => (
        <option key={chat.id} value={chat.id}>
          {chat.title}
        </option>
      ))}
    </select>
  );
}

/** The editor's chat dock: a chat picker, New chat, and the conversation with its live run. */
export function ChatDock({ projectId, chatId, onChat }: Props) {
  const chats = useQuery(chatsQuery(projectId));
  const create = useCreateChat(projectId);
  const newChat = (
    <Button
      disabled={create.isPending}
      onClick={() => {
        create.mutate(
          {},
          {
            onSuccess: (chat) => {
              onChat(chat.id);
            },
          },
        );
      }}
    >
      New chat
    </Button>
  );
  if (chats.isPending) return <Notice status="loading" what="chats" />;
  if (chats.isError) return <Notice status="failed" error={chats.error} />;
  const current = chats.data.find((chat) => chat.id === chatId) ?? chats.data[0];
  if (current === undefined) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-muted">No chat yet. Start one to work with the agent.</p>
        {newChat}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ChatPicker chats={chats.data} value={current.id} onChat={onChat} />
        {newChat}
      </div>
      <DockBody projectId={projectId} chatId={current.id} />
    </div>
  );
}
