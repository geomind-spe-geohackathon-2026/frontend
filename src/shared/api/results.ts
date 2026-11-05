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

/** Which inputs moved on since a result: a newer case makes it stale; a newer plant version is only noted, since it may be another plant. */
export function toStaleness(
  project: Pick<Project, "case_version" | "plant_version">,
  made: Pick<Result, "case_version" | "plant_version">,
): { caseChanged: boolean; newerPlant: boolean } {
  return {
    caseChanged: isOlder(made.case_version, project.case_version),
    newerPlant: isOlder(made.plant_version, project.plant_version),
  };
}

/** True when a result was made on an older case than the project has now; a newer plant version does not make it out of date. */
export function isOutOfDate(
  project: Pick<Project, "case_version" | "plant_version">,
  made: Pick<Result, "case_version" | "plant_version">,
): boolean {
  return toStaleness(project, made).caseChanged;
}

/** Whether the API marks a result infeasible (backend 1.1.110 `feasible: false`: it does not serve every demand). */
export function isInfeasible(result: object): boolean {
  return "feasible" in result && result.feasible === false;
}
