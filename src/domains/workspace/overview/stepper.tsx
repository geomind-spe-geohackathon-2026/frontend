import { Link } from "react-router-dom";
import type { Project, ProgressStep } from "@/shared/api/types";
import { Chip } from "@/shared/ui/chip";
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
}: {
  projectId: string;
  progress: Project["progress"];
}) {
  return (
    <ol className="grid grid-cols-5 gap-3 max-[1000px]:grid-cols-2 max-[720px]:grid-cols-1">
      {designSteps.map((step) => (
        <li key={step.key}>
          <Link
            to={`/projects/${projectId}/${step.route}`}
            className="flex h-full flex-col gap-1.5 rounded-card border border-border bg-surface p-3 text-text no-underline hover:border-accent"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="text-muted">
                {step.number}
              </span>
              <Chip tone={tones[progress[step.key].state]}>{progress[step.key].label}</Chip>
            </span>
            <b>{step.name}</b>
            <span className="text-muted">{step.description}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
