import {
  Activity,
  ChartColumn,
  ClipboardList,
  FileText,
  Files,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  PencilRuler,
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

const designNav: NavGroup[] = [
  { label: null, items: [{ to: "overview", label: "Overview", icon: LayoutDashboard }] },
  {
    label: "Assistant",
    items: [
      { to: "assistant/chat", label: "Chat", icon: MessageSquare },
      { to: "assistant/runs", label: "Runs and logs", icon: ScrollText },
    ],
  },
  {
    label: "Design",
    items: [
      { to: "design/editor", label: "Editor", icon: PencilRuler },
      { to: "design/case", label: "1 Case", progress: "case", icon: ClipboardList },
      { to: "design/plant", label: "2 Plant", progress: "plant", icon: Workflow },
      { to: "design/study", label: "3 Study", progress: "study", icon: FlaskConical },
      { to: "design/results", label: "4 Results", progress: "results", icon: ChartColumn },
      { to: "design/report", label: "5 Report", progress: "report", icon: FileText },
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

/** The sidebar groups; Operation shows only with VITE_FEATURE_OPERATION. */
export const projectNav: NavGroup[] =
  import.meta.env.VITE_FEATURE_OPERATION === "true" ? [...designNav, ...operationNav] : designNav;

export const projectFooterNav: NavItem[] = [
  { to: "documents", label: "Documents", icon: Files },
  { to: "settings", label: "Project settings", icon: Settings },
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
