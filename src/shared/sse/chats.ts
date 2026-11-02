import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import type { Page } from "@/shared/api/pagination";

/** Collects every page of a cursor list into one array. */
export async function toAllItems<T>(
  fetchPage: (cursor: string | undefined) => Promise<Page<T>>,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;
  do {
    const page = await fetchPage(cursor);
    items.push(...page.items);
    cursor = page.next ?? undefined;
  } while (cursor !== undefined);
  return items;
}

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
