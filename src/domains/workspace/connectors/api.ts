import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import type { ConnectorCreate, ConnectorUpdate } from "@/shared/api/pending";

export const connectorKeys = { all: ["connectors"] as const };

/** Query options for every connector of the workspace. */
export const connectorsQuery = () =>
  queryOptions({
    queryKey: connectorKeys.all,
    queryFn: async ({ signal }) => toData(await api.GET("/workspace/connectors", { signal })),
  });

function useRefresh() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: connectorKeys.all });
}

/** Mutation that adds a connector; the server checks it once. */
export function useAddConnector() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (body: ConnectorCreate) =>
      toData(await api.POST("/workspace/connectors", { body })),
    onSuccess: refresh,
  });
}

/** Mutation that changes a connector, for example turns it on or off. */
export function useUpdateConnector(connectorId: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (body: ConnectorUpdate) =>
      toData(
        await api.PATCH("/workspace/connectors/{connector_id}", {
          params: { path: { connector_id: connectorId } },
          body,
        }),
      ),
    onSuccess: refresh,
  });
}

/** Mutation that checks a connector again and reads its tools. */
export function useCheckConnector(connectorId: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async () =>
      toData(
        await api.POST("/workspace/connectors/{connector_id}/check", {
          params: { path: { connector_id: connectorId } },
        }),
      ),
    onSuccess: refresh,
  });
}

/** Mutation that removes a connector. */
export function useDeleteConnector(connectorId: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async () => {
      await api.DELETE("/workspace/connectors/{connector_id}", {
        params: { path: { connector_id: connectorId } },
      });
    },
    onSuccess: refresh,
  });
}
