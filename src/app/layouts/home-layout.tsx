import { Outlet, useLocation } from "react-router-dom";
import { toNotice } from "@/app/notice";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";

/** Level 2 of the shell: the app sidebar and the page in the main panel, for the projects, account and users. */
export function HomeLayout() {
  const location = useLocation();
  const notice = toNotice(location.state);
  return (
    <SidebarProvider className="min-h-0 flex-1">
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <SidebarTrigger className="m-2 md:hidden" />
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 p-4 md:p-6 lg:px-8 lg:pt-10">
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
