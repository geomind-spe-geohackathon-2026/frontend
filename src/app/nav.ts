import type { Project } from "@/shared/api/types";

export type ProgressKey = keyof Project["progress"];

export type NavItem = { to: string; label: string; progress?: ProgressKey };

export type NavGroup = { label: string | null; items: NavItem[]; disabled?: boolean };

export const projectNav: NavGroup[] = [
  { label: null, items: [{ to: "overview", label: "Overview" }] },
  {
    label: "Assistant",
    items: [
      { to: "assistant/chat", label: "Chat" },
      { to: "assistant/runs", label: "Runs and logs" },
    ],
  },
  {
    label: "Design",
    items: [
      { to: "design/case", label: "1 Problem", progress: "case" },
      { to: "design/plant", label: "2 Plant", progress: "plant" },
      { to: "design/study", label: "3 Study", progress: "study" },
      { to: "design/results", label: "4 Results", progress: "results" },
      { to: "design/report", label: "Report", progress: "report" },
    ],
  },
  {
    label: "Operation",
    disabled: true,
    items: [
      { to: "operation/series", label: "Time series" },
      { to: "operation/wells", label: "Well performance" },
      { to: "operation/integrity", label: "Integrity" },
    ],
  },
];

export const projectFooterNav: NavItem[] = [
  { to: "documents", label: "Documents" },
  { to: "settings", label: "Project settings" },
];

export type Crumb = { label: string; to?: string };

const homeLabels: Record<string, string> = { "/account": "Account", "/users": "Users" };

/** Breadcrumb of a page outside a project: Projects, then the page. */
export function toHomeCrumbs(pathname: string): Crumb[] {
  const page = homeLabels[pathname];
  if (page === undefined) return [{ label: "Projects" }];
  return [{ label: "Projects", to: "/projects" }, { label: page }];
}

/** Breadcrumb of a page inside a project: Projects, project, section, page. */
export function toProjectCrumbs(pathname: string, project: { id: string; name: string }): Crumb[] {
  const base = `/projects/${project.id}`;
  const rest = pathname.slice(base.length + 1);
  const head: Crumb[] = [
    { label: "Projects", to: "/projects" },
    { label: project.name, to: `${base}/overview` },
  ];
  const groups = [...projectNav, { label: null, items: projectFooterNav }];
  for (const group of groups) {
    const item = group.items.find((candidate) => rest.startsWith(candidate.to));
    if (item === undefined) continue;
    return group.label === null || group.label === "Operation"
      ? [...head, { label: item.label }]
      : [...head, { label: group.label }, { label: item.label }];
  }
  return head;
}
