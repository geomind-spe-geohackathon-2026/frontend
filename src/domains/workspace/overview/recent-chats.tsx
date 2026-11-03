import { Link } from "react-router-dom";
import { toDateTimeLabel } from "@/lib/datelabel";
import { Card, CardAction, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Chat } from "@/shared/api/types";

const activeStatuses = ["queued", "running", "waiting"];

/** The latest chats of the project with a status chip while a run is active. */
export function RecentChats({ projectId, chats }: { projectId: string; chats: Chat[] }) {
  return (
    <Card>
      <CardHeader>
        <h2>Recent chats</h2>
        <CardAction>
          <Link to={`/projects/${projectId}/assistant/chat`}>All chats</Link>
        </CardAction>
      </CardHeader>
      {chats.length === 0 ? (
        <p className="p-3 text-muted">No chats yet. Ask the assistant above.</p>
      ) : (
        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
            >
              <span className="w-28 flex-none text-muted">{toDateTimeLabel(chat.created)}</span>
              <Link to={`/projects/${projectId}/assistant/chat/${chat.id}`} className="flex-1">
                {chat.title}
              </Link>
              {chat.last_run !== null && activeStatuses.includes(chat.last_run.status) ? (
                <Badge variant="info">{chat.last_run.status}</Badge>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
