import type { Study } from "@/shared/api/types";

export type StudyProgress =
  | { kind: "none" }
  | { kind: "indeterminate"; text: string }
  | { kind: "determinate"; done: number; total: number; text: string };

/** Decides how a study's progress is drawn: gemini reports none until a study ends, so a run shows no percentage. */
export function toProgress(study: Study): StudyProgress {
  const { done, total } = study.progress;
  if (study.status === "done") {
    return { kind: "determinate", done: total, total, text: "finished" };
  }
  if (study.status === "queued") return { kind: "indeterminate", text: "waiting for a worker" };
  if (study.status !== "running") return { kind: "none" };
  if (total > 1 && done > 0) {
    return { kind: "determinate", done, total, text: `${String(done)} of ${String(total)}` };
  }
  return { kind: "indeterminate", text: "running, progress is shown when it ends" };
}
