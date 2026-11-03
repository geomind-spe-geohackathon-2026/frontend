import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import { assistantRoutes } from "@/domains/assistant/routes";
import { designRoutes } from "@/domains/design/routes";
import { identityRoutes } from "@/domains/identity/routes";
import { workspaceRoutes } from "@/domains/workspace/routes";
import type { DomainRoutes } from "@/shared/layout/routes";
import { AdminGuard, AuthGuard } from "./auth-guard";
import { HomeLayout } from "./layouts/home-layout";
import { ProjectLayout } from "./layouts/project-layout";
import { RouteError } from "./route-error";

const domains: DomainRoutes[] = [identityRoutes, workspaceRoutes, assistantRoutes, designRoutes];

const collect = (pick: (domain: DomainRoutes) => RouteObject[] | undefined): RouteObject[] =>
  domains.flatMap((domain) => pick(domain) ?? []);

/** The route tree: sign in, then home level, admin pages and project level behind the auth guard. */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <p className="p-6 text-muted">Loading</p>,
    children: [
      ...collect((domain) => domain.public),
      {
        Component: AuthGuard,
        children: [
          {
            Component: HomeLayout,
            children: [
              { path: "/", element: <Navigate to="/projects" replace /> },
              ...collect((domain) => domain.home),
              { Component: AdminGuard, children: collect((domain) => domain.admin) },
            ],
          },
          {
            path: "/projects/:projectId",
            Component: ProjectLayout,
            children: [
              { index: true, element: <Navigate to="assistant/chat" replace /> },
              ...collect((domain) => domain.project),
            ],
          },
          { path: "*", element: <Navigate to="/projects" replace /> },
        ],
      },
    ],
  },
];

/** Creates the browser router for the production and development app. */
export function createRouter() {
  return createBrowserRouter(routes);
}
