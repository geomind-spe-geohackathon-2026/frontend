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
  version: (projectId: string, number: number) =>
    [...caseKeys.all(projectId), "versions", number] as const,
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

/** Query options for one saved case version; a saved version never changes. */
export const caseVersionQuery = (projectId: string, number: number) =>
  queryOptions({
    queryKey: caseKeys.version(projectId, number),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/design/case/versions/{number}", {
          params: { path: { number }, query: { project: projectId } },
          signal,
        }),
      ),
    staleTime: Infinity,
  });

/** Mutation that saves an older case version again as the newest one; base is the latest number the user saw. */
export function useRestoreCase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ number, base }: { number: number; base: number }) =>
      toData(
        await api.POST("/design/case/versions/{number}/restore", {
          params: { path: { number } },
          body: { project: projectId, base },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: caseKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

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

/** Mutation that uploads a series file; the answer is the new case version. */
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

/** Mutation that saves a case version without an unused file. */
export function useRemoveCaseFile(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { base: number; name: string }) =>
      toData(
        await api.DELETE("/design/case/files/{name}", {
          params: {
            path: { name: input.name },
            query: { project: projectId, base: input.base },
          },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: caseKeys.all(projectId) }),
  });
}

/** Reads a saved file of the case as text. */
export async function readCaseFile(
  projectId: string,
  version: number,
  name: string,
): Promise<string> {
  const { data } = await api.GET("/design/case/files/{name}", {
    params: { path: { name }, query: { project: projectId, version } },
    parseAs: "text",
  });
  return typeof data === "string" ? data : "";
}
