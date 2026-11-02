import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { pagedQuery } from "@/shared/api/pagination";

export const runKeys = {
  all: (projectId: string) => ["projects", projectId, "runs"] as const,
  list: (projectId: string) => [...runKeys.all(projectId), "list"] as const,
  usage: (projectId: string) => [...runKeys.all(projectId), "usage"] as const,
  log: (projectId: string, runId: string) => [...runKeys.all(projectId), "log", runId] as const,
};

/** Infinite query options for the runs of a project, newest first. */
export const runsQuery = (projectId: string) =>
  pagedQuery(runKeys.list(projectId), async (cursor, signal) =>
    toData(
      await api.GET("/assistant/runs", {
        params: { query: { project: projectId, ...(cursor === null ? {} : { cursor }) } },
        signal,
      }),
    ),
  );

/** Query options for the project totals shown in the runs header. */
export const usageQuery = (projectId: string) =>
  queryOptions({
    queryKey: runKeys.usage(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/assistant/usage", { params: { query: { project: projectId } }, signal }),
      ),
  });

/** Query options for the full log of one run. */
export const runLogQuery = (projectId: string, runId: string) =>
  queryOptions({
    queryKey: runKeys.log(projectId, runId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/assistant/runs/{id}/log", { params: { path: { id: runId } }, signal }),
      ),
  });

/** Downloads the log of a run as a JSON or Markdown file through the authenticated client. */
export async function downloadLog(runId: string, format: "json" | "md"): Promise<void> {
  const blob = toData(
    await api.GET("/assistant/runs/{id}/log/export", {
      params: { path: { id: runId }, query: { format } },
      parseAs: "blob",
    }),
  );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `run-${runId}.${format}`;
  link.click();
  URL.revokeObjectURL(link.href);
}
