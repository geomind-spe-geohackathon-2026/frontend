import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";

export const overviewKeys = {
  detail: (projectId: string) => ["projects", projectId, "overview"] as const,
};

/** Query options for the overview of one project: progress, recent chats, activity and active runs. */
export const overviewQuery = (projectId: string) =>
  queryOptions({
    queryKey: overviewKeys.detail(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/workspace/overview", { params: { query: { project: projectId } }, signal }),
      ),
  });
