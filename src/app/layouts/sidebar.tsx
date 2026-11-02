import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { projectFooterNav, projectNav, type NavItem } from "@/app/nav";
import type { Project, ProgressStep } from "@/shared/api/types";
import { cn } from "@/lib/cn";

type Props = { project: Project };

const dotTone: Record<ProgressStep["state"], string> = {
  empty: "bg-border",
  incomplete: "bg-warn",
  ready: "bg-ok",
  running: "bg-accent",
  done: "bg-ok",
};

const linkClass =
  "flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-text no-underline hover:bg-surface";

function toMissing(step: ProgressStep | undefined): ReactNode {
  const count = /(\d+) missing/.exec(step?.label ?? "")?.[1];
  if (count === undefined) return null;
  return (
    <span className="rounded-pill bg-warn-soft px-1.5 text-[10.5px] font-medium text-warn">
      {count}
    </span>
  );
}

function StatusDot({ step }: { step: ProgressStep }) {
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

function Item({ item, project }: { item: NavItem; project: Project }) {
  const progress = item.progress === undefined ? undefined : project.progress[item.progress];
  return (
    <NavLink
      to={`/projects/${project.id}/${item.to}`}
      className={({ isActive }) =>
        cn(linkClass, isActive && "bg-accent-soft font-medium text-accent")
      }
    >
      <item.icon aria-hidden="true" className="size-4 flex-none" />
      <span className="min-w-0 flex-1">{item.label}</span>
      {toMissing(progress)}
      {progress === undefined ? null : <StatusDot step={progress} />}
    </NavLink>
  );
}

function DisabledItem({ item }: { item: NavItem }) {
  return (
    <button
      type="button"
      disabled
      className={cn(linkClass, "cursor-not-allowed text-muted opacity-70 hover:bg-transparent")}
    >
      <item.icon aria-hidden="true" className="size-4 flex-none" />
      <span className="min-w-0 flex-1">{item.label}</span>
      <span className="rounded-pill border border-border bg-surface px-1.5 py-px text-[10px]">
        later
      </span>
    </button>
  );
}

/** The project sidebar: switch project, the Assistant, Design and Operation groups, documents and settings. */
export function Sidebar({ project }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="project-navigation"
        className="hidden w-full border-b border-border bg-sunken px-[18px] py-2 text-left font-medium max-[720px]:block"
        onClick={() => {
          setOpen(!open);
        }}
      >
        Menu
      </button>
      <nav
        id="project-navigation"
        aria-label="Project"
        className={cn(
          "flex w-[210px] flex-none flex-col gap-3 border-r border-border bg-sunken px-2.5 py-3 max-[720px]:w-full max-[720px]:border-r-0 max-[720px]:border-b",
          !open && "max-[720px]:hidden",
        )}
      >
        <div className="flex flex-col gap-0.5 border-b border-border px-2 pb-2.5">
          <b className="text-sm">{project.name}</b>
          <NavLink to="/projects" className="text-xs">
            Switch project
          </NavLink>
        </div>
        {projectNav.map((group) => (
          <div key={group.label ?? "top"} className="flex flex-col gap-px">
            {group.label === null ? null : (
              <span className="px-2 pb-1 text-[11px] font-medium tracking-[0.06em] text-muted uppercase">
                {group.label}
              </span>
            )}
            {group.items.map((item) =>
              group.disabled === true ? (
                <DisabledItem key={item.to} item={item} />
              ) : (
                <Item key={item.to} item={item} project={project} />
              ),
            )}
          </div>
        ))}
        <div className="mt-auto flex flex-col gap-px border-t border-border pt-2.5 max-[720px]:mt-0">
          {projectFooterNav.map((item) => (
            <Item key={item.to} item={item} project={project} />
          ))}
        </div>
      </nav>
    </>
  );
}
