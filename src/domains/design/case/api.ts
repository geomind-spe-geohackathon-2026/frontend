import { pagedQuery } from "@/shared/api/pagination";
import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData, toFormData } from "@/shared/api/client";
import { projectKeys } from "@/shared/api/projects";
import type { CaseContent, SaveCaseInput, UploadInput } from "./types";

export const caseKeys = {
  all: (projectId: string) => ["projects", projectId, "case"] as const,
  latest: (projectId: string) => [...caseKeys.all(projectId), "latest"] as const,
  schema: () => ["case", "schema"] as const,
  versions: (projectId: string) => [...caseKeys.all(projectId), "versions"] as const,
  series: (projectId: string, version: number) =>
    [...caseKeys.all(projectId), "series", version] as const,
  validation: (projectId: string, content: CaseContent) =>
    ["case", "validation", projectId, content] as const,
};

/** Query options for the latest case of a project; a 404 case_not_found means it has none yet. */
export const caseQuery = (projectId: string) =>
  queryOptions({
    queryKey: caseKeys.latest(projectId),
    queryFn: async ({ signal }) =>
      toData(await api.GET("/design/case", { params: { query: { project: projectId } }, signal })),
  });

/** Query options for gemini's JSON schema of a case; it never changes during a session. */
export const caseSchemaQuery = () =>
  queryOptions({
    queryKey: caseKeys.schema(),
    queryFn: async ({ signal }) => toData(await api.GET("/design/case/schema", { signal })),
    staleTime: Infinity,
  });

/** Query options for the version list of a case. */
export const caseVersionsQuery = (projectId: string) =>
  queryOptions({
    queryKey: caseKeys.versions(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/design/case/versions", {
          params: { query: { project: projectId } },
          signal,
        }),
      ).items,
  });

/** Query options for the series of a case version, read through gemini. */
export const caseSeriesQuery = (projectId: string, version: number) =>
  queryOptions({
    queryKey: caseKeys.series(projectId, version),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/design/case/series", { params: { query: { project: projectId } }, signal }),
      ),
  });

/** Query options for the server check of a draft; it keeps the last answer while a new one loads. */
export const caseValidationQuery = (projectId: string, content: CaseContent, enabled: boolean) =>
  queryOptions({
    queryKey: caseKeys.validation(projectId, content),
    queryFn: async ({ signal }) =>
      toData(
        await api.POST("/design/case/validate", { body: { content, project: projectId }, signal }),
      ),
    enabled,
    placeholderData: keepPreviousData,
  });

/** Mutation that saves a new case version and puts it in the cache. */
export function useSaveCase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveCaseInput) =>
      toData(await api.POST("/design/case", { body: { project: projectId, ...input } })),
    onSuccess: async (saved) => {
      queryClient.setQueryData(caseKeys.latest(projectId), saved);
      await queryClient.invalidateQueries({ queryKey: caseKeys.versions(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

type UploadBody = { project: string; base?: number | null; name: string; file: Blob };

function toUploadForm(body: UploadBody): FormData {
  return toFormData({ ...body, file: new File([body.file], body.name) });
}

/** Mutation that uploads a series file; the answer is the new case version. */
/** Paged query options for the projects a case can be copied from. */
export const copySourcesQuery = () =>
  pagedQuery(["projects", "list", ""], async (cursor, signal) =>
    toData(
      await api.GET("/workspace/projects", {
        params: { query: cursor === null ? {} : { cursor } },
        signal,
      }),
    ),
  );

/** Mutation that copies another project's latest case into this project. */
export function useCopyCase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (source: string) =>
      toData(
        await api.POST("/workspace/projects/{project_id}/case/copy", {
          params: { path: { project_id: projectId } },
          body: { case_from: source },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useUploadCaseFile(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadInput) =>
      toData(
        await api.POST("/design/case/files", {
          body: { project: projectId, ...input },
          bodySerializer: toUploadForm,
        }),
      ),
    onSuccess: async (saved) => {
      queryClient.setQueryData(caseKeys.latest(projectId), saved);
      await queryClient.invalidateQueries({ queryKey: caseKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
