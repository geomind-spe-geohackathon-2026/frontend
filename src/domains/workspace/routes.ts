import type { DomainRoutes } from "@/shared/layout/routes";

export const workspaceRoutes: DomainRoutes = {
  home: [
    {
      path: "/projects",
      lazy: () => import("./projects/page").then((m) => ({ Component: m.ProjectsPage })),
    },
  ],
  project: [
    {
      path: "overview",
      lazy: () => import("./overview/page").then((m) => ({ Component: m.OverviewPage })),
    },
    {
      path: "documents",
      lazy: () => import("./documents/page").then((m) => ({ Component: m.DocumentsPage })),
    },
    {
      path: "settings",
      lazy: () => import("./settings/page").then((m) => ({ Component: m.SettingsPage })),
    },
  ],
};
