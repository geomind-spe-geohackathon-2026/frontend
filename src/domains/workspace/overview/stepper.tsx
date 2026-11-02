import { Link } from "react-router-dom";
import type { Project, ProgressStep } from "@/shared/api/types";
import { cn } from "@/lib/cn";
import { Chip } from "@/shared/ui/chip";
import type { StepKey } from "./stale";
import { toNextStep } from "./next-step";
import { designSteps } from "./steps";

const tones: Record<ProgressStep["state"], "ok" | "warn" | "info" | "off"> = {
  empty: "off",
  incomplete: "warn",
  ready: "ok",
  running: "info",
  done: "ok",
};

/** The five design steps as cards with a state chip; each card opens its page. */
export function Stepper({
  projectId,
  progress,
  stale,
}: {
  projectId: string;
  progress: Project["progress"];
  stale: ReadonlySet<StepKey>;
}) {
  const next = toNextStep(progress, stale);
  return (
    <ol className="grid grid-cols-5 gap-3 max-[1000px]:grid-cols-2 max-[720px]:grid-cols-1">
      {designSteps.map((step) => (
        <li key={step.key}>
          <Link
            to={`/projects/${projectId}/${step.route}`}
            className={cn(
              "flex h-full flex-col gap-1.5 rounded-card border bg-surface p-3 text-text no-underline hover:border-accent",
              step.key === next ? "border-accent" : "border-border",
            )}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="text-muted">
                {step.number}
              </span>
              {stale.has(step.key) ? (
                <Chip tone="warn">Out of date</Chip>
              ) : (
                <Chip tone={tones[progress[step.key].state]}>{progress[step.key].label}</Chip>
              )}
              {step.key === next ? <span className="ml-auto text-accent">Next</span> : null}
            </span>
            <b>{step.name}</b>
            <span className="text-muted">{step.description}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
