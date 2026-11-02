import { cn } from "@/lib/cn";
import type { Project, ProgressStep } from "@/shared/api/types";
import { stepNames } from "./steps";

const segmentTone: Record<ProgressStep["state"], string> = {
  empty: "bg-border",
  incomplete: "bg-warn",
  ready: "bg-ok",
  running: "bg-accent",
  done: "bg-ok",
};

/** Five segments, one per design step, coloured by state; each segment also has a text for screen readers. */
export function ProgressBar({ progress }: { progress: Project["progress"] }) {
  return (
    <ol aria-label="Design progress" className="flex gap-1">
      {stepNames.map((step) => (
        <li
          key={step.key}
          title={`${step.name}: ${progress[step.key].label}`}
          className={cn("h-1.5 flex-1 rounded-pill", segmentTone[progress[step.key].state])}
        >
          <span className="sr-only">{`${step.name}: ${progress[step.key].label}`}</span>
        </li>
      ))}
    </ol>
  );
}
