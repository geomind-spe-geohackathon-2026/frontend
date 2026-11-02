import type { Project, Result } from "@/shared/api/types";

export type StepKey = keyof Project["progress"];

type Versions = Pick<Project, "case_version" | "plant_version">;
type Made = Pick<Result, "case_version" | "plant_version">;

function isOlder(made: number | null, current: number | null): boolean {
  return made !== null && current !== null && made < current;
}

/** The steps whose outcome was made on an older problem or plant than the project has now. */
export function toStaleSteps(project: Versions, latest: Made | undefined): ReadonlySet<StepKey> {
  if (latest === undefined) return new Set();
  const stale =
    isOlder(latest.case_version, project.case_version) ||
    isOlder(latest.plant_version, project.plant_version);
  return stale ? new Set<StepKey>(["study", "results"]) : new Set<StepKey>();
}
