import { isOutOfDate } from "@/shared/api/results";
import type { Project, Result } from "@/shared/api/types";

export type StepKey = keyof Project["progress"];

type Versions = Pick<Project, "case_version" | "plant_version">;
type Made = Pick<Result, "case_version" | "plant_version">;

function toNewest<T extends { created: string }>(items: readonly T[]): T | undefined {
  return items.reduce<T | undefined>(
    (newest, item) => (newest === undefined || item.created > newest.created ? item : newest),
    undefined,
  );
}

/** The steps whose outcome was made on an older problem or plant than the project has now, judged by the newest result (the list comes oldest first). */
export function toStaleSteps(
  project: Versions,
  results: readonly (Made & { created: string })[] | undefined,
): ReadonlySet<StepKey> {
  const latest = toNewest(results ?? []);
  if (latest === undefined) return new Set();
  return isOutOfDate(project, latest) ? new Set<StepKey>(["study", "results"]) : new Set<StepKey>();
}
