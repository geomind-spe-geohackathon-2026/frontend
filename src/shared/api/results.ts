import { queryOptions } from "@tanstack/react-query";
import type { Project, Result } from "./types";
import { api, toData } from "./client";
import { toAllItems } from "./pagination";

/** Query key of the result summaries of a project. */
export const resultsKey = (projectId: string) =>
  ["projects", projectId, "results", "list"] as const;

/** Query options for every result summary of a project; results and report read the same cache entry. */
export const resultsQuery = (projectId: string) =>
  queryOptions({
    queryKey: resultsKey(projectId),
    queryFn: ({ signal }) =>
      toAllItems(async (cursor) =>
        toData(
          await api.GET("/design/results", {
            params: { query: { project: projectId, ...(cursor === undefined ? {} : { cursor }) } },
            signal,
          }),
        ),
      ),
  });

function isOlder(made: number | null, current: number | null): boolean {
  return made !== null && current !== null && made < current;
}

/** True when a result was made on an older case or plant than the project has now. */
export function isOutOfDate(
  project: Pick<Project, "case_version" | "plant_version">,
  made: Pick<Result, "case_version" | "plant_version">,
): boolean {
  return (
    isOlder(made.case_version, project.case_version) ||
    isOlder(made.plant_version, project.plant_version)
  );
}
