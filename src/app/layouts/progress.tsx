import { useQuery } from "@tanstack/react-query";
import type { ProgressKey } from "@/app/nav";
import { toStaleSteps } from "@/domains/workspace/overview/stale";
import { resultsQuery } from "@/shared/api/results";
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

type Made = { created: string; case_version: number | null; plant_version: number | null };

function toChanged(project: Project, results: readonly Made[] | undefined): string {
  const latest = [...(results ?? [])].sort((a, b) => b.created.localeCompare(a.created))[0];
  if (latest === undefined) return "the case or the plant";
  const changed = [
    ...(latest.case_version !== null &&
    project.case_version !== null &&
    latest.case_version < project.case_version
      ? [`the case (version ${String(latest.case_version)}, now ${String(project.case_version)})`]
      : []),
    ...(latest.plant_version !== null &&
    project.plant_version !== null &&
    latest.plant_version < project.plant_version
      ? [
          `the plant (version ${String(latest.plant_version)}, now ${String(project.plant_version)})`,
        ]
      : []),
  ];
  return changed.length === 0 ? "the case or the plant" : changed.join(" and ");
}

/** The progress of each design step, marking a step out of date when the newest result is older than its input. */
export function useStepProgress(project: Project): (key: ProgressKey) => ProgressStep {
  const results = useQuery(resultsQuery(project.id));
  const stale = toStaleSteps(project, results.data);
  const label = `Out of date: ${toChanged(project, results.data)} changed after the newest result was made. Run the study again to update it.`;
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

function toDotText(step: ProgressStep): string {
  if (step.label.startsWith("Out of date")) return step.label;
  const head =
    step.label === stateWords[step.state] ? step.label : `${stateWords[step.state]}: ${step.label}`;
  const action = step.label.includes(' missing')
    ? "Fill in the missing values on this page."
    : step.label.includes(' blocked')
      ? "Fill in the values the blocked studies wait for, then start them."
      : (actions[step.state] ?? "");
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
