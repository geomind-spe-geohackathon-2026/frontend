import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "./client";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (projectId: string) => [...projectKeys.all, projectId] as const,
};

/** Query options for one project; the shell and every project page read the same cache entry. */
export const projectQuery = (projectId: string) =>
  queryOptions({
    queryKey: projectKeys.detail(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/workspace/projects/{project_id}", {
          params: { path: { project_id: projectId } },
          signal,
        }),
      ),
  });
