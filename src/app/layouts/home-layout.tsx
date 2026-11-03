import { Outlet, useLocation } from "react-router-dom";
import { toHomeCrumbs } from "@/app/nav";
import { toNotice } from "@/app/notice";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { HomeSidebar } from "./home-sidebar";
import { TopBar } from "./top-bar";

/** Level 2 of the shell: the sidebar and the main panel, for the projects, account and users. */
export function HomeLayout() {
  const location = useLocation();
  const notice = toNotice(location.state);
  return (
    <SidebarProvider className="min-h-0 flex-1">
      <HomeSidebar />
      <SidebarInset className="min-w-0">
        <TopBar
          crumbs={toHomeCrumbs(location.pathname)}
          start={
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4!" />
            </>
          }
        />
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 p-4 md:p-6 lg:px-8">
          {notice === null ? null : (
            <p
              role="status"
              className="rounded-card border border-warn bg-warn-soft px-3 py-2 text-warn"
            >
              {notice}
            </p>
          )}
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
