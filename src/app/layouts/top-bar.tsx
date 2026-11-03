import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Crumb } from "@/app/nav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Props = { crumbs: Crumb[]; children?: ReactNode };

function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumb aria-label="Breadcrumb" className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.label}>
            {index === 0 ? null : <BreadcrumbSeparator className="max-sm:hidden" />}
            <BreadcrumbItem className={index === crumbs.length - 1 ? "min-w-0" : "max-sm:hidden"}>
              {crumb.to === undefined && index === crumbs.length - 1 ? (
                <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
              ) : crumb.to === undefined ? (
                crumb.label
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.to} className="truncate text-muted no-underline">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** The one top bar of the main panel: the sidebar toggle on phones, the breadcrumb and optional actions. */
export function TopBar({ crumbs, children }: Props) {
  return (
    <header className="flex h-12 flex-none items-center gap-2.5 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <Crumbs crumbs={crumbs} />
      <div className="flex-1" />
      {children}
    </header>
  );
}
