import { queryOptions, useMutation } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { toAllItems } from "@/shared/api/pagination";
import type { ReportExport, ReportRequest } from "@/shared/api/types";

export const reportKeys = {
  all: (projectId: string) => ["projects", projectId, "report"] as const,
  runs: (projectId: string) => [...reportKeys.all(projectId), "runs"] as const,
  studies: (projectId: string) => [...reportKeys.all(projectId), "studies"] as const,
  preview: (request: ReportRequest) =>
    [...reportKeys.all(request.project), "preview", request] as const,
};

/** Query options for the report sections the backend offers, in order with their titles. */
export const partsQuery = () =>
  queryOptions({
    queryKey: ["report", "parts"] as const,
    queryFn: async ({ signal }) => toData(await api.GET("/reporting/design/parts", { signal })),
    staleTime: 5 * 60_000,
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

/** Query options for every study of the project: the report reads their objective and the run that started them. */
export const reportStudiesQuery = (projectId: string) =>
  queryOptions({
    queryKey: reportKeys.studies(projectId),
    queryFn: ({ signal }) =>
      toAllItems(async (cursor) =>
        toData(
          await api.GET("/design/study", {
            params: { query: { project: projectId, ...(cursor === undefined ? {} : { cursor }) } },
            signal,
          }),
        ),
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
    mutationFn: async (request: ReportExport) =>
      toData(await api.POST("/reporting/design/export", { body: request, parseAs: "blob" })),
  });
}
