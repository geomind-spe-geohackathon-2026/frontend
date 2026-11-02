import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { pagedQuery } from "@/shared/api/pagination";
import { projectKeys } from "@/shared/api/projects";
import type { NewProject } from "./types";

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
    mutationFn: async (input: NewProject) =>
      toData(await api.POST("/workspace/projects", { body: input })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

/** Mutation that imports a project zip and refreshes every project list. */
export function useImportProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return toData(await api.POST("/workspace/projects/import", { body }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
