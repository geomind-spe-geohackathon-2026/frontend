import { Outlet, useLocation } from "react-router-dom";
import { toHomeCrumbs } from "@/app/nav";
import { toNotice } from "@/app/notice";
import { TopBar } from "./top-bar";

/** Level 2 of the shell: top bar only, for the projects home, account and users. */
export function HomeLayout() {
  const location = useLocation();
  const notice = toNotice(location.state);
  return (
    <>
      <TopBar crumbs={toHomeCrumbs(location.pathname)} />
      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 p-4 md:p-6 lg:px-8">
        {notice === null ? null : (
          <p
            role="status"
            className="rounded-card border border-warn bg-warn-soft px-3 py-2 text-warn"
          >
            {notice}
          </p>
        )}
        <Outlet />
      </main>
    </>
  );
}
