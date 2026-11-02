import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { projectKeys } from "@/shared/api/projects";
import type { CaseContent, SaveCaseInput, UploadInput } from "./types";

export const caseKeys = {
  all: (projectId: string) => ["projects", projectId, "case"] as const,
  latest: (projectId: string) => [...caseKeys.all(projectId), "latest"] as const,
  schema: () => ["case", "schema"] as const,
  versions: (projectId: string) => [...caseKeys.all(projectId), "versions"] as const,
  series: (projectId: string, version: number) =>
    [...caseKeys.all(projectId), "series", version] as const,
  validation: (content: CaseContent) => ["case", "validation", content] as const,
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
      ),
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
export const caseValidationQuery = (content: CaseContent, enabled: boolean) =>
  queryOptions({
    queryKey: caseKeys.validation(content),
    queryFn: async ({ signal }) =>
      toData(await api.POST("/design/case/validate", { body: { content }, signal })),
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

function toForm(body: { project: string; base: number | null; name: string; file: Blob }) {
  const form = new FormData();
  form.set("project", body.project);
  form.set("base", body.base === null ? "" : String(body.base));
  form.set("name", body.name);
  form.set("file", body.file, body.name);
  return form;
}

/** Mutation that uploads a series file; the answer is the new case version. */
export function useUploadCaseFile(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadInput) =>
      toData(
        await api.POST("/design/case/files", {
          body: { project: projectId, ...input },
          bodySerializer: toForm,
        }),
      ),
    onSuccess: async (saved) => {
      queryClient.setQueryData(caseKeys.latest(projectId), saved);
      await queryClient.invalidateQueries({ queryKey: caseKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
