import {
  Activity,
  ChartColumn,
  ClipboardList,
  FileText,
  Files,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Project } from "@/shared/api/types";

export type ProgressKey = keyof Project["progress"];

export type NavItem = { to: string; label: string; icon: LucideIcon; progress?: ProgressKey };

export type NavGroup = { label: string | null; items: NavItem[]; disabled?: boolean };

/** The design steps; they open in the Design panel next to the chat. */
export const designItems: NavItem[] = [
  { to: "design/case", label: "Case", progress: "case", icon: ClipboardList },
  { to: "design/plant", label: "Plant", progress: "plant", icon: Workflow },
  { to: "design/study", label: "Study", progress: "study", icon: FlaskConical },
  { to: "design/results", label: "Results", progress: "results", icon: ChartColumn },
  { to: "design/report", label: "Report", progress: "report", icon: FileText },
];

const pageNav: NavGroup[] = [
  {
    label: null,
    items: [
      { to: "overview", label: "Overview", icon: LayoutDashboard },
      { to: "assistant/runs", label: "Runs and logs", icon: ScrollText },
      { to: "documents", label: "Documents", icon: Files },
      { to: "settings", label: "Project settings", icon: Settings },
    ],
  },
];

const operationNav: NavGroup[] = [
  {
    label: "Operation",
    disabled: true,
    items: [
      { to: "operation/series", label: "Time series", icon: Activity },
      { to: "operation/wells", label: "Well performance", icon: Gauge },
      { to: "operation/integrity", label: "Integrity", icon: ShieldCheck },
    ],
  },
];

/** The project pages in the sidebar, which open in the main panel; Operation shows only with VITE_FEATURE_OPERATION. */
export const projectNav: NavGroup[] =
  import.meta.env.VITE_FEATURE_OPERATION === "true" ? [...pageNav, ...operationNav] : pageNav;

export type Crumb = { label: string; to?: string };

const homeLabels: Record<string, string> = { "/account": "Account", "/users": "Users" };

/** Breadcrumb of a page outside a project: Projects, then the page. */
export function toHomeCrumbs(pathname: string): Crumb[] {
  const page = homeLabels[pathname];
  if (page === undefined) return [{ label: "Projects" }];
  return [{ label: "Projects", to: "/projects" }, { label: page }];
}

/** The design step of a page path inside a project (`design/case`), if it is one. */
export function toDesignItem(rest: string): NavItem | undefined {
  return designItems.find((item) => rest.startsWith(item.to));
}

/** Breadcrumb of the main panel inside a project: Projects, project, page (the chat while a design step is open). */
export function toProjectCrumbs(pathname: string, project: { id: string; name: string }): Crumb[] {
  const base = `/projects/${project.id}`;
  const rest = pathname.slice(base.length + 1);
  const head: Crumb[] = [
    { label: "Projects", to: "/projects" },
    { label: project.name, to: `${base}/assistant/chat` },
  ];
  if (rest.startsWith("assistant/chat") || toDesignItem(rest) !== undefined) {
    return [...head, { label: "Chat" }];
  }
  for (const group of projectNav) {
    const item = group.items.find((candidate) => rest.startsWith(candidate.to));
    if (item !== undefined) return [...head, { label: item.label }];
  }
  return head;
}
