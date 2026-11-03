import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toProjectCrumbs } from "@/app/nav";
import { hasCode } from "@/shared/api/errors";
import { projectQuery } from "@/shared/api/projects";
import { useRequiredParam } from "@/shared/layout/params";
import { RunPill } from "./run-pill";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

/** Level 3 of the shell: top bar with breadcrumb and run pill, project sidebar, and the page. */
export function ProjectLayout() {
  const projectId = useRequiredParam("projectId");
  const location = useLocation();
  const project = useQuery(projectQuery(projectId));

  if (hasCode(project.error, "project_not_found")) {
    return (
      <Navigate
        to="/projects"
        replace
        state={{ notice: "That project does not exist or you cannot see it." }}
      />
    );
  }
  if (project.data === undefined) {
    return (
      <>
        <TopBar crumbs={[{ label: "Projects", to: "/projects" }]} />
        <main className="p-6">
          {project.isError ? (
            <p role="alert" className="text-bad">
              {project.error.message}
            </p>
          ) : (
            <p className="text-muted">Loading project</p>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar crumbs={toProjectCrumbs(location.pathname, project.data)}>
        <RunPill projectId={projectId} />
      </TopBar>
      <div className="flex min-h-0 flex-1 max-[720px]:flex-col">
        <Sidebar key={location.pathname} project={project.data} />
        <main className="min-w-0 flex-1 p-[18px]">
          <Outlet />
        </main>
      </div>
    </>
  );
}
