import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { toAllItems } from "@/shared/api/pagination";

/** Query key of the chat list of a project. */
export const chatsKey = (projectId: string) => ["projects", projectId, "chats", "list"] as const;

/** Query options for the chats of a project, newest first. */
export const chatsQuery = (projectId: string) =>
  queryOptions({
    queryKey: chatsKey(projectId),
    queryFn: ({ signal }) =>
      toAllItems(async (cursor) =>
        toData(
          await api.GET("/assistant/chat", {
            params: { query: { project: projectId, ...(cursor === undefined ? {} : { cursor }) } },
            signal,
          }),
        ),
      ),
  });
