import { lazy, Suspense } from "react";
import { Link, NavLink, useLocation, useMatch } from "react-router-dom";
import {
  BookOpen,
  CalendarClock,
  Ellipsis,
  FolderOpen,
  MessageSquare,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { projectNav, toDesignItem, type NavItem } from "@/app/nav";
import { ChatList } from "@/domains/assistant/chat/chat-list";
import { togglePin, usePins, type Pin } from "@/shared/layout/pins";
import { openMainDialog, useMainDialog } from "@/shared/layout/main-dialog";
import type { Project } from "@/shared/api/types";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/shared/ui/logo";
import { useShownChat } from "./shown-chat";
import { UserMenu } from "./user-menu";
import { ProjectMenu, SidebarSection } from "./sidebar-section";

const NewProjectDialog = lazy(() =>
  import("@/domains/workspace/projects/new-project-dialog").then((module) => ({
    default: module.NewProjectDialog,
  })),
);
const SearchDialog = lazy(() =>
  import("./search-dialog").then((module) => ({ default: module.SearchDialog })),
);

type Props = { project: Project };

const linkClass =
  "text-sidebar-foreground no-underline data-[active=true]:text-sidebar-accent-foreground";

function PageItem({ item, project }: { item: NavItem; project: Project }) {
  const to = `/projects/${project.id}/${item.to}`;
  const active = useMatch({ path: to, end: false }) !== null;
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <NavLink
          to={to}
          className={linkClass}
          onClick={() => {
            setOpenMobile(false);
          }}
        >
          <item.icon aria-hidden="true" />
          <span className="min-w-0 flex-1">{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DisabledItem({ item }: { item: NavItem }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton disabled tooltip={item.label}>
        <item.icon aria-hidden="true" />
        <span className="min-w-0 flex-1">{item.label}</span>
        <Badge variant="off">later</Badge>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function Brand() {
  return (
    <SidebarHeader className="h-12 flex-row items-center justify-between px-3 py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
      <Link
        to="/projects"
        className="flex items-center gap-2 text-[15px] font-semibold text-foreground no-underline group-data-[collapsible=icon]:hidden"
      >
        <Logo />
        Geomind
      </Link>
      <SidebarTrigger />
    </SidebarHeader>
  );
}

function MainDialogs() {
  const open = useMainDialog();
  const onClose = () => {
    openMainDialog(null);
  };
  return (
    <Suspense fallback={null}>
      {open === "new" ? (
        <NewProjectDialog
          open
          onOpenChange={(next) => {
            if (!next) onClose();
          }}
        />
      ) : null}
      {open === "search" ? <SearchDialog onClose={onClose} /> : null}
    </Suspense>
  );
}

function SoonItem({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton disabled tooltip={`${label} (soon)`}>
        <Icon aria-hidden="true" />
        <span className="min-w-0 flex-1">{label}</span>
        <Badge variant="off">soon</Badge>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function MainItems() {
  const { setOpenMobile } = useSidebar();
  const onProjects = useMatch({ path: "/projects", end: true }) !== null;
  return (
    <nav aria-label="Main">
      <SidebarGroup className="py-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New project"
              onClick={() => {
                openMainDialog("new");
              }}
            >
              <Plus aria-hidden="true" />
              <span>New</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search"
              onClick={() => {
                openMainDialog("search");
              }}
            >
              <Search aria-hidden="true" />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={onProjects} tooltip="Projects">
              <Link
                to="/projects"
                className={linkClass}
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <FolderOpen aria-hidden="true" />
                <span>Projects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SoonItem label="Knowledge" icon={BookOpen} />
          <SoonItem label="Scheduled" icon={CalendarClock} />
        </SidebarMenu>
      </SidebarGroup>
    </nav>
  );
}

function toPinHref(pin: Pin): string {
  return pin.kind === "project"
    ? `/projects/${pin.id}`
    : `/projects/${pin.projectId}/assistant/chat/${pin.id}`;
}

function PinnedItem({ pin, active }: { pin: Pin; active: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link to={toPinHref(pin)} className={linkClass}>
          {pin.kind === "project" ? (
            <FolderOpen aria-hidden="true" />
          ) : (
            <MessageSquare aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1 truncate">{pin.title}</span>
        </Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover aria-label={`Actions of ${pin.title}`}>
            <Ellipsis aria-hidden="true" />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            onClick={() => {
              togglePin(pin);
            }}
          >
            Unpin
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function PinnedItems() {
  const pins = usePins();
  const { pathname } = useLocation();
  if (pins.length === 0) return null;
  return (
    <div className="group-data-[collapsible=icon]:hidden">
      <SidebarSection title="Pinned">
        <nav aria-label="Pinned">
          <SidebarMenu>
            {pins.map((pin) => (
              <PinnedItem
                key={`${pin.kind}-${pin.id}`}
                pin={pin}
                active={
                  pin.kind === "project" ? pathname === toPinHref(pin) : pathname.endsWith(pin.id)
                }
              />
            ))}
          </SidebarMenu>
        </nav>
      </SidebarSection>
    </div>
  );
}

function ProjectItems({ project }: Props) {
  const { chatId } = useShownChat();
  const location = useLocation();
  const rest = location.pathname.slice(`/projects/${project.id}/`.length);
  const designOpen = toDesignItem(rest) !== undefined;
  return (
    <>
      <SidebarSection title={project.name} action={<ProjectMenu project={project} />}>
        <nav aria-label="Project">
          {projectNav.map((group) => (
            <SidebarMenu key={group.label ?? "pages"}>
              {group.items.map((item) =>
                group.disabled === true ? (
                  <DisabledItem key={item.to} item={item} />
                ) : (
                  <PageItem key={item.to} item={item} project={project} />
                ),
              )}
            </SidebarMenu>
          ))}
        </nav>
      </SidebarSection>
      <div className="group-data-[collapsible=icon]:hidden">
        <SidebarSection title="Chats">
          <ChatList
            projectId={project.id}
            activeChatId={chatId}
            toHref={(id) =>
              designOpen
                ? `${location.pathname}?chat=${id}`
                : `/projects/${project.id}/assistant/chat/${id}`
            }
          />
        </SidebarSection>
      </div>
    </>
  );
}

/** The one sidebar of the app: brand and toggle; New, Search, Projects, Knowledge and Scheduled; pins; the open project with its pages, then its chats; the user menu at the bottom. */
export function AppSidebar({ project }: { project?: Project | undefined }) {
  return (
    <>
      <MainDialogs />
      <Sidebar collapsible="icon">
        <Brand />
        <SidebarContent>
          <MainItems />
          <PinnedItems />
          {project === undefined ? null : <ProjectItems project={project} />}
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
