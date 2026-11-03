import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toNavItem, toProjectCrumbs } from "@/app/nav";
import { ChatMain } from "@/domains/assistant/chat/page";
import { hasCode } from "@/shared/api/errors";
import { projectQuery } from "@/shared/api/projects";
import { chatsQuery } from "@/shared/sse/chats";
import { useRequiredParam } from "@/shared/layout/params";
import type { Project } from "@/shared/api/types";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/components/ui/use-mobile";
import { Notice } from "@/shared/ui/notice";
import { HomeSidebar } from "./home-sidebar";
import { RunPill } from "./run-pill";
import { ShownChatContext } from "./shown-chat";
import { SidePanel } from "./side-panel";
import { ProjectSidebar } from "./sidebar";
import { TopBar } from "./top-bar";

const trigger = (
  <>
    <SidebarTrigger className="-ml-1" />
    <Separator orientation="vertical" className="h-4!" />
  </>
);

function Shell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <SidebarProvider className="min-h-0 flex-1">
      {sidebar}
      <SidebarInset className="h-svh min-w-0 overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  );
}

function useShownChatId(projectId: string, routeChat: string | null, onChatRoute: boolean) {
  const [params] = useSearchParams();
  const [last, setLast] = useState<string | null>(routeChat);
  if (routeChat !== null && routeChat !== last) setLast(routeChat);
  const asked = params.get("chat");
  const chats = useQuery({
    ...chatsQuery(projectId),
    enabled: !onChatRoute && asked === null && last === null,
  });
  if (onChatRoute) return routeChat;
  return asked ?? last ?? chats.data?.[0]?.id ?? null;
}

type WorkbenchProps = {
  projectId: string;
  label: string;
  chatId: string | null;
  onChatRoute: boolean;
};

function Workbench({ projectId, label, chatId, onChatRoute }: WorkbenchProps) {
  const [expanded, setExpanded] = useState(false);
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const close = () => {
    setExpanded(false);
    const chat = chatId === null ? "?new" : `/${chatId}`;
    void navigate(`/projects/${projectId}/assistant/chat${chat}`);
  };
  const page = (
    <SidePanel
      label={label}
      expanded={expanded || mobile}
      onExpand={() => {
        setExpanded(!expanded);
      }}
      onClose={close}
    >
      <Outlet />
    </SidePanel>
  );
  let body: ReactNode;
  if (onChatRoute) body = <Outlet />;
  else if (expanded || mobile) body = page;
  else {
    body = (
      <div className="flex h-full min-h-0">
        <div className="h-full w-[38%] min-w-[340px] flex-none border-r">
          <ChatMain projectId={projectId} chatId={chatId} level={2} />
        </div>
        <div className="h-full min-w-0 flex-1">{page}</div>
      </div>
    );
  }
  return <div className="min-h-0 flex-1 border-t">{body}</div>;
}

function ProjectShell({ project }: { project: Project }) {
  const location = useLocation();
  const chatRoute = useMatch("/projects/:projectId/assistant/chat/:chatId?");
  const onChatRoute = chatRoute !== null;
  const chatId = useShownChatId(project.id, chatRoute?.params.chatId ?? null, onChatRoute);
  const rest = location.pathname.slice(`/projects/${project.id}/`.length);
  return (
    <ShownChatContext.Provider value={{ chatId, sidePage: !onChatRoute }}>
      <Shell sidebar={<ProjectSidebar project={project} />}>
        <TopBar crumbs={toProjectCrumbs(location.pathname, project)} start={trigger}>
          <RunPill projectId={project.id} />
        </TopBar>
        <Workbench
          projectId={project.id}
          label={toNavItem(rest)?.label ?? "Page"}
          chatId={chatId}
          onChatRoute={onChatRoute}
        />
      </Shell>
    </ShownChatContext.Provider>
  );
}

/** Level 3 of the shell: the project sidebar, the chat in the main panel and a page in the side panel. */
export function ProjectLayout() {
  const projectId = useRequiredParam("projectId");
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
      <Shell sidebar={<HomeSidebar />}>
        <TopBar crumbs={[{ label: "Projects", to: "/projects" }]} start={trigger} />
        <div className="p-6">
          {project.isError ? (
            <p role="alert" className="text-bad">
              {project.error.message}
            </p>
          ) : (
            <Notice status="loading" what="project" />
          )}
        </div>
      </Shell>
    );
  }

  return <ProjectShell project={project.data} />;
}
