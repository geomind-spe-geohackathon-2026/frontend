import { Link, NavLink, useMatch } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Logo } from "@/shared/ui/logo";
import { UserMenu } from "./user-menu";

/** The sidebar outside a project: the brand, the projects, and the user menu at the bottom. */
export function HomeSidebar() {
  const active = useMatch({ path: "/projects", end: true }) !== null;
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Geomind" className="h-10">
              <Link to="/projects" className="text-foreground no-underline">
                <Logo />
                <b className="text-[15px] group-data-[collapsible=icon]:hidden">Geomind</b>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Main">
          <SidebarGroup className="py-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={active} tooltip="Projects">
                  <NavLink
                    to="/projects"
                    end
                    className="text-sidebar-foreground no-underline data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <FolderOpen aria-hidden="true" />
                    <span>Projects</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
