import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData, toFormData } from "@/shared/api/client";
import { pagedQuery } from "@/shared/api/pagination";
import { projectKeys } from "@/shared/api/projects";
import type { ProjectCreate } from "@/shared/api/types";

function toQuery(search: string, cursor: string | null) {
  return {
    ...(search === "" ? {} : { search }),
    ...(cursor === null ? {} : { cursor }),
  };
}

/** Paged query options for the projects the caller may see, filtered by name. */
export const projectsQuery = (search: string) =>
  pagedQuery([...projectKeys.all, "list", search], async (cursor, signal) =>
    toData(
      await api.GET("/workspace/projects", {
        params: { query: toQuery(search, cursor) },
        signal,
      }),
    ),
  );

/** Mutation that creates an empty project and refreshes every project list. */
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectCreate) =>
      toData(await api.POST("/workspace/projects", { body: input })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

/** Mutation that imports a project zip and refreshes every project list. */
export function useImportProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      return toData(
        await api.POST("/workspace/projects/import", {
          body: { file },
          bodySerializer: toFormData,
        }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
