import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toProjectCrumbs } from "@/app/nav";
import { hasCode } from "@/shared/api/errors";
import { projectQuery } from "@/shared/api/projects";
import { useRequiredParam } from "@/shared/layout/params";
import { RunPill } from "./run-pill";
import { ProjectSidebar } from "./sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TopBar } from "./top-bar";
import { Notice } from "@/shared/ui/notice";

/** Level 3 of the shell: collapsible project sidebar, top bar with breadcrumb and run pill, and the page. */
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
            <Notice status="loading" what="project" />
          )}
        </main>
      </>
    );
  }

  return (
    <SidebarProvider className="min-h-0 flex-1">
      <ProjectSidebar project={project.data} />
      <SidebarInset className="min-w-0">
        <TopBar
          crumbs={toProjectCrumbs(location.pathname, project.data)}
          start={
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4!" />
            </>
          }
        >
          <RunPill projectId={projectId} />
        </TopBar>
        <div className="min-w-0 flex-1 p-[18px]">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
