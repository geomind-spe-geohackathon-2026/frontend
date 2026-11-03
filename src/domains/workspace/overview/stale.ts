import { isOutOfDate } from "@/shared/api/results";
import type { Project, Result } from "@/shared/api/types";

export type StepKey = keyof Project["progress"];

type Versions = Pick<Project, "case_version" | "plant_version">;
type Made = Pick<Result, "case_version" | "plant_version">;

/** The steps whose outcome was made on an older problem or plant than the project has now. */
export function toStaleSteps(project: Versions, latest: Made | undefined): ReadonlySet<StepKey> {
  if (latest === undefined) return new Set();
  return isOutOfDate(project, latest) ? new Set<StepKey>(["study", "results"]) : new Set<StepKey>();
}
