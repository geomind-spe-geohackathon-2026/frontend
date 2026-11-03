import { Link } from "react-router-dom";
import { toDateLabel } from "@/lib/datelabel";
import type { Project } from "@/shared/api/types";
import { ProgressBar } from "./progress-bar";
import { stepNames } from "./steps";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isPinned, togglePin, usePins } from "@/shared/layout/pins";

function toSummary(progress: Project["progress"]): string {
  const next = stepNames.find((step) => progress[step.key].state !== "done");
  if (next === undefined) return "Design complete";
  return `${next.name}: ${progress[next.key].label}`;
}

function toCount(count: number, name: string): string {
  return `${String(count)} ${name}${count === 1 ? "" : "s"}`;
}

function PinMenu({ project }: { project: Project }) {
  const pins = usePins();
  const pinned = isPinned(pins, "project", project.id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions of ${project.name}`}
          className="relative z-10 text-muted-foreground"
        >
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            togglePin({
              kind: "project",
              id: project.id,
              projectId: project.id,
              title: project.name,
            });
          }}
        >
          {pinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** One project card: name, owner, last change, its chats and runs, the five-step progress bar, the step to work on next, and a menu to pin it. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <div
      data-slot="project-card"
      className="relative flex min-h-[118px] flex-col gap-2 rounded-card border border-border bg-surface p-4 hover:bg-sunken/50"
    >
      <div className="flex items-start gap-2">
        <h2 className="min-w-0 flex-1 truncate text-[15px]">
          <Link
            to={`/projects/${project.id}`}
            className="text-text no-underline after:absolute after:inset-0 after:content-['']"
          >
            {project.name}
          </Link>
        </h2>
        <PinMenu project={project} />
      </div>
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
    </div>
  );
}
