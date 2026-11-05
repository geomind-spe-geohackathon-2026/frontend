import { createElement } from "react";
import type { DomainRoutes } from "@/shared/layout/routes";

export const workspaceRoutes: DomainRoutes = {
  home: [
    {
      path: "/projects",
      lazy: () =>
        Promise.all([import("./projects/page"), import("./settings/project-menu")]).then(
          ([page, menu]) => ({
            Component: () => createElement(page.ProjectsPage, { menu: menu.ProjectMenu }),
          }),
        ),
    },
    {
      path: "/knowledge",
      lazy: () => import("./documents/page").then((m) => ({ Component: m.KnowledgePage })),
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
