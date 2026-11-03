import type { DomainRoutes } from "@/shared/layout/routes";

export const workspaceRoutes: DomainRoutes = {
  home: [
    {
      path: "/projects",
      lazy: () => import("./projects/page").then((m) => ({ Component: m.ProjectsPage })),
    },
    {
      path: "/knowledge",
      lazy: () => import("./knowledge/page").then((m) => ({ Component: m.KnowledgePage })),
    },
    {
      path: "/connectors",
      lazy: () => import("./connectors/page").then((m) => ({ Component: m.ConnectorsPage })),
    },
  ],
  project: [
    {
      path: "overview",
      lazy: () => import("./overview/page").then((m) => ({ Component: m.OverviewPage })),
    },
    {
      path: "library",
      lazy: () => import("./documents/page").then((m) => ({ Component: m.DocumentsPage })),
    },
    {
      path: "settings",
      lazy: () => import("./settings/page").then((m) => ({ Component: m.SettingsPage })),
    },
  ],
};
