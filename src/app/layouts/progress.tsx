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

/** The progress of each design step, marking a step out of date when the newest result is older than its input. */
export function useStepProgress(project: Project): (key: ProgressKey) => ProgressStep {
  const results = useQuery(resultsQuery(project.id));
  const stale = toStaleSteps(project, results.data?.[0]);
  return (key) =>
    stale.has(key) ? { state: "incomplete", label: "Out of date" } : project.progress[key];
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

/** A coloured dot for the state of a step, with its label for screen readers. */
export function StatusDot({ step }: { step: ProgressStep }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn("size-2 flex-none rounded-full", dotTone[step.state])}
      />
      <span className="sr-only">{step.label}</span>
    </>
  );
}
