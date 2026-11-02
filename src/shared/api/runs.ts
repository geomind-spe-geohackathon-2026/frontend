import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "./client";

/** Query key of the active runs of a project. */
export const activeRunsKey = (projectId: string) =>
  ["projects", projectId, "runs", "active"] as const;

/** Query options for the runs of a project that are queued, running or waiting; polled for the top bar pill. */
export const activeRunsQuery = (projectId: string) =>
  queryOptions({
    queryKey: activeRunsKey(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/assistant/runs", {
          params: { query: { project: projectId, status: "active" } },
          signal,
        }),
      ),
    refetchInterval: 10_000,
  });
