import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { projectKeys } from "@/shared/api/projects";

const listKey = [...projectKeys.all, "list"] as const;

/** Mutation that renames the project and refreshes every project query. */
export function useRenameProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) =>
      toData(
        await api.PATCH("/workspace/projects/{project_id}", {
          params: { path: { project_id: projectId } },
          body: { name },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

/** Mutation that deletes the project and refreshes the project lists. */
export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.DELETE("/workspace/projects/{project_id}", {
        params: { path: { project_id: projectId } },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });
}

/** Mutation that downloads the project zip as a Blob. */
export function useExportProject(projectId: string) {
  return useMutation({
    mutationFn: async () =>
      toData(
        await api.GET("/workspace/projects/{project_id}/export", {
          params: { path: { project_id: projectId } },
          parseAs: "blob",
        }),
      ),
  });
}
