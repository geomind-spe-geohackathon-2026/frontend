import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";

export const resultKeys = {
  all: (projectId: string) => ["projects", projectId, "results"] as const,
  detail: (projectId: string, resultId: string) =>
    [...resultKeys.all(projectId), "detail", resultId] as const,
  compare: (projectId: string, ids: string[], x: string, y: string) =>
    [...resultKeys.all(projectId), "compare", ids, x, y] as const,
};

/** Query options for one result with capacities, coverage and constraints. */
export const resultQuery = (projectId: string, resultId: string) =>
  queryOptions({
    queryKey: resultKeys.detail(projectId, resultId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/design/results/{result_id}", {
          params: { path: { result_id: resultId } },
          signal,
        }),
      ),
  });

/** Query options for the comparison of chosen results on two KPIs, with the Pareto set. */
export const comparisonQuery = (projectId: string, ids: string[], x: string, y: string) =>
  queryOptions({
    queryKey: resultKeys.compare(projectId, ids, x, y),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/design/results/compare", {
          params: { query: { project: projectId, ids: ids.join(","), x, y } },
          signal,
        }),
      ),
    enabled: ids.length > 0 && x !== "" && y !== "",
  });

/** Mutation that saves a result's design as the next plant version. */
export function useAdoptDesign(projectId: string, resultId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      toData(
        await api.POST("/design/results/{result_id}/adopt", {
          params: { path: { result_id: resultId } },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}
