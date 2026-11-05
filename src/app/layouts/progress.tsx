import { useQuery } from "@tanstack/react-query";
import type { ProgressKey } from "@/app/nav";
import { toStaleSteps } from "@/domains/workspace/overview/stale";
import { resultsQuery } from "@/shared/api/results";
import { toNewest, toOutOfDateText, toPlantNote } from "@/shared/ui/out-of-date";
import type { Project, ProgressStep } from "@/shared/api/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const dotTone: Record<ProgressStep["state"], string> = {
  empty: "bg-border",
  incomplete: "bg-warn",
  ready: "bg-ok",
  running: "bg-accent",
  done: "bg-ok",
};

/** The progress of each design step, marking a step out of date when the newest result ran on an older case (a newer plant version is only noted). */
export function useStepProgress(project: Project): (key: ProgressKey) => ProgressStep {
  const results = useQuery(resultsQuery(project.id));
  const stale = toStaleSteps(project, results.data);
  const latest = toNewest(results.data);
  const note = latest === undefined ? null : toPlantNote(project, latest);
  const text =
    toOutOfDateText(project, results.data) ??
    "Out of date: the case changed after the newest result was made. Run the study again to update it.";
  const label = note === null ? text : `${text} ${note}`;
  return (key) => (stale.has(key) ? { state: "incomplete", label } : project.progress[key]);
}

const stateWords: Record<ProgressStep["state"], string> = {
  empty: "Not started",
  incomplete: "Needs attention",
  ready: "Ready",
  running: "Running",
  done: "Done",
};

const actions: Partial<Record<ProgressStep["state"], string>> = {
  empty: "Open this step to start it.",
  running: "It turns green when the work finishes.",
};

const labelActions: [string, string][] = [
  [" missing", "Fill in the missing values on this page."],
  [" blocked", "Fill in the values the blocked studies wait for, then start them."],
  ["Not saved", "Save a design as the plant on the Plant page."],
];

function toDotText(step: ProgressStep): string {
  if (step.label.startsWith("Out of date")) return step.label;
  const head =
    step.label === stateWords[step.state] ? step.label : `${stateWords[step.state]}: ${step.label}`;
  const action =
    labelActions.find(([part]) => step.label.includes(part))?.[1] ?? actions[step.state] ?? "";
  return `${head}.${action === "" ? "" : ` ${action}`} Green is done or ready, amber needs attention, grey is not started.`;
}

/** A small badge with the number of missing values of a step, or nothing. */
export function MissingBadge({ step }: { step: ProgressStep }) {
  const count = /(\d+) missing/.exec(step.label)?.[1];
  if (count === undefined) return null;
  return (
    <Badge variant="warn" className="px-1.5 py-0 text-[10.5px]">
      {count}
    </Badge>
  );
}

/** A coloured dot for the state of a step; hovering it, and screen readers, give the state in words, its reason and what clears it. */
export function StatusDot({ step }: { step: ProgressStep }) {
  const text = toDotText(step);
  return (
    <span title={text} className="inline-flex flex-none items-center p-0.5">
      <span
        aria-hidden="true"
        className={cn("size-2 flex-none rounded-full", dotTone[step.state])}
      />
      <span className="sr-only">{text}</span>
    </span>
  );
}
