import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "./client";
import { toAllItems } from "./pagination";

/** Query key of the result summaries of a project. */
export const resultsKey = (projectId: string) =>
  ["projects", projectId, "results", "list"] as const;

/** Query options for every result summary of a project; results and report read the same cache entry. */
export const resultsQuery = (projectId: string) =>
  queryOptions({
    queryKey: resultsKey(projectId),
    queryFn: ({ signal }) =>
      toAllItems(async (cursor) =>
        toData(
          await api.GET("/design/results", {
            params: { query: { project: projectId, ...(cursor === undefined ? {} : { cursor }) } },
            signal,
          }),
        ),
      ),
  });
