import type { Project, Run } from "@/shared/api/types";

export type Activity = {
  id: string;
  time: string;
  actor: { kind: "user" | "agent"; name: string };
  text: string;
  link: { route: string; id: string | null } | null;
};

export type Chat = {
  id: string;
  project: string;
  title: string;
  created: string;
  last_run: { id: string; status: Run["status"] } | null;
};

export type Overview = {
  progress: Project["progress"];
  chats: Chat[];
  activity: Activity[];
  active_runs: Run[];
};

export type NewChat = { project: string; title?: string };
export type NewMessage = { content: string };
export type MessageReply = { message: { id: string; chat: string }; run: { id: string } };
