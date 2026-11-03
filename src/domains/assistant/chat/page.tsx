import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { useRequiredParam } from "@/shared/layout/params";
import { ErrorNotice } from "@/shared/sse/notice";
import { chatsQuery } from "@/shared/sse/chats";
import { messagesQuery } from "./api";
import { ChatWorkspace } from "./workspace";
import { Notice } from "@/shared/ui/notice";

function ChatBody({ projectId, chatId }: { projectId: string; chatId: string }) {
  const messages = useQuery(messagesQuery(projectId, chatId));
  if (messages.isPending) return <Notice status="loading" what="messages" />;
  if (messages.isError) return <ErrorNotice error={messages.error} what="The chat" />;
  const runId = messages.data.findLast((message) => message.run !== null)?.run ?? null;
  return (
    <ChatWorkspace
      key={`${chatId}/${runId ?? ""}`}
      projectId={projectId}
      chatId={chatId}
      runId={runId}
      messages={messages.data}
    />
  );
}

type MainProps = { projectId: string; chatId: string | null; level: 1 | 2 };

/** The chat in the main panel: the conversation with its live run and the message box, centred like a chat app. */
export function ChatMain({ projectId, chatId, level }: MainProps) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="@container h-full min-h-0 overflow-y-auto px-4 pt-4 pb-3 md:px-6">
      <Heading className="sr-only">Chat</Heading>
      <div className="mx-auto h-full max-w-3xl">
        {chatId === null ? (
          <ChatWorkspace key="new" projectId={projectId} chatId={null} runId={null} messages={[]} />
        ) : (
          <ChatBody projectId={projectId} chatId={chatId} />
        )}
      </div>
    </div>
  );
}

/** The chat route: opens the latest chat unless a new one was asked for, and shows it in the main panel. */
export function ChatPage() {
  const projectId = useRequiredParam("projectId");
  const chatId = useParams().chatId ?? null;
  const [params] = useSearchParams();
  const chats = useQuery({ ...chatsQuery(projectId), enabled: chatId === null });
  const latest = chats.data?.[0];
  if (chatId === null && !params.has("new") && latest !== undefined) {
    return <Navigate replace to={`/projects/${projectId}/assistant/chat/${latest.id}`} />;
  }
  return <ChatMain projectId={projectId} chatId={chatId} level={1} />;
}
