import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { projectKeys } from "@/shared/api/projects";
import type { Layout } from "@/shared/api/layout";
import type {
  PlantSpec,
  SaveFlowsheetInput,
  SaveParametersInput,
  SavePlantRangesInput,
} from "./types";

export const plantKeys = {
  all: (projectId: string) => ["projects", projectId, "plant"] as const,
  flowsheet: (projectId: string) => [...plantKeys.all(projectId), "flowsheet"] as const,
  versions: (projectId: string) => [...plantKeys.all(projectId), "versions"] as const,
  version: (projectId: string, number: number) =>
    [...plantKeys.all(projectId), "version", number] as const,
  parameters: (projectId: string, module: string) =>
    [...plantKeys.all(projectId), "parameters", module] as const,
  palette: () => ["plant", "palette"] as const,
  templates: () => ["plant", "templates"] as const,
  ports: () => ["plant", "ports"] as const,
  suggest: (projectId: string, port: string) =>
    [...plantKeys.all(projectId), "suggest", port] as const,
  validation: (projectId: string, spec: PlantSpec) =>
    [...plantKeys.all(projectId), "validation", spec] as const,
};

/** Query options for the latest flowsheet; a 404 plant_not_found means the project has no plant yet. */
export const flowsheetQuery = (projectId: string) =>
  queryOptions({
    queryKey: plantKeys.flowsheet(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/plant/flowsheet", { params: { query: { project: projectId } }, signal }),
      ),
  });

/** Query options for gemini's module registry, grouped by category in the palette. */
export const paletteQuery = () =>
  queryOptions({
    queryKey: plantKeys.palette(),
    queryFn: async ({ signal }) => toData(await api.GET("/plant/flowsheet/palette", { signal })),
    staleTime: Infinity,
  });

/** Query options for the inlets and outlets of every module type, with gemini's stream kinds. */
export const portsQuery = () =>
  queryOptions({
    queryKey: plantKeys.ports(),
    queryFn: async ({ signal }) => toData(await api.GET("/plant/flowsheet/ports", { signal })),
    staleTime: Infinity,
  });

/** Query options for the named plant templates. */
export const templatesQuery = () =>
  queryOptions({
    queryKey: plantKeys.templates(),
    queryFn: async ({ signal }) => toData(await api.GET("/plant/flowsheet/templates", { signal })),
    staleTime: Infinity,
  });

/** Query options for the saved plant versions, newest first. */
export const plantVersionsQuery = (projectId: string) =>
  queryOptions({
    queryKey: plantKeys.versions(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/plant/flowsheet/versions", {
          params: { query: { project: projectId } },
          signal,
        }),
      ).items,
  });

/** Query options for one saved version of the flowsheet, used to restore it into the editor. */
export const plantVersionQuery = (projectId: string, number: number) =>
  queryOptions({
    queryKey: plantKeys.version(projectId, number),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/plant/flowsheet/versions/{number}", {
          params: { path: { number }, query: { project: projectId } },
          signal,
        }),
      ),
  });

/** Query options for the parameters of one module: schema with units, values and missing names. */
export const parametersQuery = (projectId: string, module: string) =>
  queryOptions({
    queryKey: plantKeys.parameters(projectId, module),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/plant/parameters", {
          params: { query: { project: projectId, module } },
          signal,
        }),
      ),
  });

/** Query options for what a study can search that no module holds, such as the number of doublets. */
export const plantSearchQuery = (projectId: string) =>
  queryOptions({
    queryKey: [...plantKeys.all(projectId), "plant-search"],
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/plant/parameters/plant", {
          params: { query: { project: projectId } },
          signal,
        }),
      ),
  });

/** Query options for the server check of a draft spec on the latest case of the project; it keeps the last answer while a new one loads. */
export const plantValidationQuery = (projectId: string, spec: PlantSpec) =>
  queryOptions({
    queryKey: plantKeys.validation(projectId, spec),
    queryFn: async ({ signal }) =>
      toData(
        await api.POST("/plant/flowsheet/validate", {
          body: { spec, project: projectId },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });

/** Mutation that saves a new flowsheet version from a spec or from a template. */
export function useSaveFlowsheet(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveFlowsheetInput) =>
      toData(await api.POST("/plant/flowsheet", { body: { project: projectId, ...input } })),
    onSuccess: async (saved) => {
      queryClient.setQueryData(plantKeys.flowsheet(projectId), saved);
      await queryClient.invalidateQueries({ queryKey: plantKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

/** Mutation that saves node positions without a new version. */
export function useSaveLayout(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { base: number; layout: Layout }) =>
      toData(await api.PUT("/plant/flowsheet/layout", { body: { project: projectId, ...input } })),
    onSuccess: (saved) => {
      queryClient.setQueryData(plantKeys.flowsheet(projectId), saved);
    },
  });
}

/** Mutation that saves the plant-level search ranges as a new plant version. */
export function useSavePlantRanges(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SavePlantRangesInput) =>
      toData(await api.POST("/plant/parameters/plant", { body: { project: projectId, ...input } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: plantKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

/** Mutation that saves the parameters of one module as a new plant version. */
export function useSaveParameters(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveParametersInput) =>
      toData(await api.POST("/plant/parameters", { body: { project: projectId, ...input } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: plantKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

/** Query options for the ports that fit one port of the saved plant; servers on gemini before 0.6 answer 501 and nothing is suggested. */
export const plantSuggestQuery = (projectId: string, port: string) =>
  queryOptions({
    queryKey: plantKeys.suggest(projectId, port),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/plant/flowsheet/suggest", {
          params: { query: { project: projectId, port, limit: 20 } },
          signal,
        }),
      ),
    retry: false,
    staleTime: 60_000,
  });
