import { lazy, Suspense, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { PanelRight } from "lucide-react";
import { toDesignItem, toProjectCrumbs, type NavItem } from "@/app/nav";
import { hasCode } from "@/shared/api/errors";
import { projectQuery } from "@/shared/api/projects";
import type { Project } from "@/shared/api/types";
import { chatsQuery } from "@/shared/sse/chats";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/components/ui/use-mobile";
import { Notice } from "@/shared/ui/notice";
import { DesignPanel } from "./design-panel";
import { RunPill } from "./run-pill";
import { ShownChatContext } from "./shown-chat";
import { AppSidebar } from "./sidebar";
import { TopBar } from "./top-bar";

const ChatMain = lazy(() =>
  import("@/domains/assistant/chat/page").then((module) => ({ default: module.ChatMain })),
);

function Shell({ project, children }: { project?: Project | undefined; children: ReactNode }) {
  return (
    <SidebarProvider className="min-h-0 flex-1">
      <AppSidebar project={project} />
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

function DesignButton({ projectId, chatId }: { projectId: string; chatId: string | null }) {
  const chat = chatId === null ? "" : `?chat=${chatId}`;
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link
        to={`/projects/${projectId}/design/case${chat}`}
        className="text-foreground no-underline"
      >
        <PanelRight aria-hidden="true" />
        Design
      </Link>
    </Button>
  );
}

function Header({
  project,
  chatId,
  design,
}: {
  project: Project;
  chatId: string | null;
  design: boolean;
}) {
  const location = useLocation();
  return (
    <TopBar crumbs={toProjectCrumbs(location.pathname, project).slice(design ? 1 : 0)}>
      <RunPill projectId={project.id} />
      {design ? null : <DesignButton projectId={project.id} chatId={chatId} />}
    </TopBar>
  );
}

function Chat({ projectId, chatId }: { projectId: string; chatId: string | null }) {
  return (
    <Suspense fallback={<Notice status="loading" what="chat" />}>
      <ChatMain projectId={projectId} chatId={chatId} level={2} />
    </Suspense>
  );
}

type DesignProps = { project: Project; current: NavItem; chatId: string | null };

function DesignView({ project, current, chatId }: DesignProps) {
  const [expanded, setExpanded] = useState(false);
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const panel = (
    <DesignPanel
      project={project}
      current={current}
      chatId={chatId}
      expanded={expanded || mobile}
      onExpand={() => {
        setExpanded(!expanded);
      }}
      onClose={() => {
        const chat = chatId === null ? "?new" : `/${chatId}`;
        void navigate(`/projects/${project.id}/assistant/chat${chat}`);
      }}
    />
  );
  if (expanded || mobile) return panel;
  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
      <ResizablePanel id="chat" defaultSize="38" minSize="22">
        <div className="flex h-full min-w-0 flex-col">
          <Header project={project} chatId={chatId} design />
          <div className="min-h-0 flex-1">
            <Chat projectId={project.id} chatId={chatId} />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle className="w-px transition-colors data-[separator=active]:w-0.5 data-[separator=active]:bg-accent data-[separator=hover]:bg-accent" />
      <ResizablePanel id="design" defaultSize="62" minSize="30">
        {panel}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ProjectShell({ project }: { project: Project }) {
  const location = useLocation();
  const chatRoute = useMatch("/projects/:projectId/assistant/chat/:chatId?");
  const onChatRoute = chatRoute !== null;
  const chatId = useShownChatId(project.id, chatRoute?.params.chatId ?? null, onChatRoute);
  const design = toDesignItem(location.pathname.slice(`/projects/${project.id}/`.length));
  let body: ReactNode;
  if (design !== undefined) {
    body = <DesignView project={project} current={design} chatId={chatId} />;
  } else {
    body = (
      <>
        <Header project={project} chatId={chatId} design={false} />
        {onChatRoute ? (
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:px-8">
            <Outlet />
          </div>
        )}
      </>
    );
  }
  return (
    <ShownChatContext.Provider value={{ chatId, sidePage: design !== undefined }}>
      <Shell project={project}>{body}</Shell>
    </ShownChatContext.Provider>
  );
}

/** Level 3 of the shell: the app sidebar with the project, the main panel, and the Design panel next to the chat. */
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
      <Shell>
        <TopBar crumbs={[{ label: "Projects", to: "/projects" }]} />
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
