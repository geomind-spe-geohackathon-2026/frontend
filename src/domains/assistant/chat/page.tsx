import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { useRequiredParam } from "@/shared/layout/params";
import { PageHeader } from "@/shared/layout/page-header";
import { ErrorNotice } from "@/shared/sse/notice";
import { chatsQuery } from "@/shared/sse/chats";
import { messagesQuery } from "./api";
import { ChatList } from "./chat-list";
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

/** The chat screen: the chats of the project, the conversation with its live run, and the run panel. */
export function ChatPage() {
  const projectId = useRequiredParam("projectId");
  const chatId = useParams().chatId ?? null;
  const [params] = useSearchParams();
  const chats = useQuery({ ...chatsQuery(projectId), enabled: chatId === null });
  const latest = chats.data?.[0];
  if (chatId === null && !params.has("new") && latest !== undefined) {
    return <Navigate replace to={`/projects/${projectId}/assistant/chat/${latest.id}`} />;
  }
  return (
    <>
      <PageHeader title="Chat" />
      <div className="grid grid-cols-[240px_minmax(0,1fr)_260px] gap-3.5 max-[1000px]:grid-cols-1">
        <ChatList projectId={projectId} activeChatId={chatId} />
        {chatId === null ? (
          <ChatWorkspace key="new" projectId={projectId} chatId={null} runId={null} messages={[]} />
        ) : (
          <ChatBody projectId={projectId} chatId={chatId} />
        )}
      </div>
    </>
  );
}
