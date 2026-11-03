import { Link } from "react-router-dom";
import { toDateLabel } from "@/lib/datelabel";
import type { Project } from "@/shared/api/types";
import { ProgressBar } from "./progress-bar";
import { stepNames } from "./steps";

function toSummary(progress: Project["progress"]): string {
  const next = stepNames.find((step) => progress[step.key].state !== "done");
  if (next === undefined) return "Design complete";
  return `${next.name}: ${progress[next.key].label}`;
}

function toCount(count: number, name: string): string {
  return `${String(count)} ${name}${count === 1 ? "" : "s"}`;
}

/** One project card: name, owner, last change, its chats and runs, the five-step progress bar and the step to work on next. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex min-h-[118px] flex-col gap-2 rounded-card border border-border bg-surface p-4 text-text no-underline hover:border-accent"
    >
      <h2 className="text-[15px]">{project.name}</h2>
      <p className="text-muted">
        Owner {project.owner.name} · updated {toDateLabel(project.updated)}
      </p>
      <p className="text-muted">
        {toCount(project.chats, "chat")} · {toCount(project.runs, "run")}
      </p>
      <div className="mt-auto flex flex-col gap-1.5">
        <ProgressBar progress={project.progress} />
        <span className="text-muted">{toSummary(project.progress)}</span>
      </div>
    </Link>
  );
}
