import { queryOptions, useMutation } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import type { ReportExportRequest, ReportRequest } from "@/shared/api/design";

export const reportKeys = {
  all: (projectId: string) => ["projects", projectId, "report"] as const,
  results: (projectId: string) => [...reportKeys.all(projectId), "results"] as const,
  runs: (projectId: string) => [...reportKeys.all(projectId), "runs"] as const,
  preview: (request: ReportRequest) =>
    [...reportKeys.all(request.project), "preview", request] as const,
};

/** Query options for the results a report can be made from. */
export const reportResultsQuery = (projectId: string) =>
  queryOptions({
    queryKey: reportKeys.results(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/design/results", { params: { query: { project: projectId } }, signal }),
      ),
  });

/** Query options for the runs whose agent log can go into a report. */
export const reportRunsQuery = (projectId: string) =>
  queryOptions({
    queryKey: reportKeys.runs(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/assistant/runs", { params: { query: { project: projectId } }, signal }),
      ),
  });

/** Query options for the live preview of the report with the chosen result, run and parts. */
export const previewQuery = (request: ReportRequest) =>
  queryOptions({
    queryKey: reportKeys.preview(request),
    queryFn: async ({ signal }) =>
      toData(await api.POST("/reporting/design/preview", { body: request, signal })),
    enabled: request.result !== "" && request.include.length > 0,
  });

/** Mutation that exports the report as a Markdown or PDF file and returns its bytes. */
export function useExportReport() {
  return useMutation({
    mutationFn: async (request: ReportExportRequest) =>
      toData(await api.POST("/reporting/design/export", { body: request, parseAs: "blob" })),
  });
}
