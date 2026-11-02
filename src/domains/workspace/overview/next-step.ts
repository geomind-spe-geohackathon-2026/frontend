import type { Project } from "@/shared/api/types";
import type { StepKey } from "./stale";

/** The design step to do next: the first one left unfinished, or the study when results are old. */
export function toNextStep(
  progress: Project["progress"],
  stale: ReadonlySet<StepKey>,
): StepKey | null {
  if (progress.case.state === "empty" || progress.case.state === "incomplete") return "case";
  if (progress.plant.state === "empty" || progress.plant.state === "incomplete") return "plant";
  if (stale.has("study") || progress.study.state === "empty") return "study";
  if (progress.report.state === "empty") return "report";
  return null;
}
