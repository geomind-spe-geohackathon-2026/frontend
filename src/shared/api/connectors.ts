import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "./client";

export const connectorKeys = { all: ["connectors"] as const };

/** Query options for every connector of the workspace, by name. */
export const connectorsQuery = () =>
  queryOptions({
    queryKey: connectorKeys.all,
    queryFn: async ({ signal }) => toData(await api.GET("/workspace/connectors", { signal })),
  });
