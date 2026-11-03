import type { ReactNode } from "react";
import { Link, NavLink, useMatch } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectFooterNav, projectNav, type NavItem, type ProgressKey } from "@/app/nav";
import { toStaleSteps } from "@/domains/workspace/overview/stale";
import { resultsQuery } from "@/shared/api/results";
import type { Project, ProgressStep } from "@/shared/api/types";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/shared/ui/logo";
import { cn } from "@/lib/cn";

type Props = { project: Project };

const dotTone: Record<ProgressStep["state"], string> = {
  empty: "bg-border",
  incomplete: "bg-warn",
  ready: "bg-ok",
  running: "bg-accent",
  done: "bg-ok",
};

function toMissing(step: ProgressStep | undefined): ReactNode {
  const count = /(\d+) missing/.exec(step?.label ?? "")?.[1];
  if (count === undefined) return null;
  return (
    <Badge variant="warn" className="px-1.5 py-0 text-[10.5px]">
      {count}
    </Badge>
  );
}

function toShown(project: Project, key: ProgressKey, stale: ReadonlySet<string>): ProgressStep {
  return stale.has(key) ? { state: "incomplete", label: "Out of date" } : project.progress[key];
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

function Item({
  item,
  project,
  stale,
}: {
  item: NavItem;
  project: Project;
  stale: ReadonlySet<string>;
}) {
  const to = `/projects/${project.id}/${item.to}`;
  const active = useMatch({ path: to, end: false }) !== null;
  const { setOpenMobile } = useSidebar();
  const progress = item.progress === undefined ? undefined : toShown(project, item.progress, stale);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <NavLink
          to={to}
          className="text-sidebar-foreground no-underline data-[active=true]:text-sidebar-accent-foreground"
          onClick={() => {
            setOpenMobile(false);
          }}
        >
          <item.icon aria-hidden="true" />
          <span className="min-w-0 flex-1">{item.label}</span>
          {toMissing(progress)}
          {progress === undefined ? null : <StatusDot step={progress} />}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DisabledItem({ item }: { item: NavItem }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton disabled tooltip={item.label}>
        <item.icon aria-hidden="true" />
        <span className="min-w-0 flex-1">{item.label}</span>
        <Badge variant="off">later</Badge>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ProjectHeader({ project }: Props) {
  return (
    <SidebarHeader className="h-14 justify-center border-b border-sidebar-border py-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild size="lg" tooltip="Switch project" className="h-10">
            <Link to="/projects" className="text-foreground no-underline">
              <Logo />
              <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <b className="truncate text-sm">{project.name}</b>
                <span className="text-xs text-muted-foreground">Switch project</span>
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

/** The project sidebar: switch project, the Assistant, Design and Operation groups, documents and settings. */
export function ProjectSidebar({ project }: Props) {
  const results = useQuery(resultsQuery(project.id));
  const stale = toStaleSteps(project, results.data?.[0]);
  return (
    <Sidebar collapsible="icon">
      <ProjectHeader project={project} />
      <nav aria-label="Project" className="contents">
        <SidebarContent>
          {projectNav.map((group) => (
            <SidebarGroup key={group.label ?? "top"} className="py-1">
              {group.label === null ? null : <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarMenu>
                {group.items.map((item) =>
                  group.disabled === true ? (
                    <DisabledItem key={item.to} item={item} />
                  ) : (
                    <Item key={item.to} item={item} project={project} stale={stale} />
                  ),
                )}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            {projectFooterNav.map((item) => (
              <Item key={item.to} item={item} project={project} stale={stale} />
            ))}
          </SidebarMenu>
        </SidebarFooter>
      </nav>
      <SidebarRail />
    </Sidebar>
  );
}
