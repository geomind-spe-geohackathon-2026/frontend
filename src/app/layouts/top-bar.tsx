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
import { Logo } from "@/shared/ui/logo";
import { UserMenu } from "./user-menu";

type Props = { crumbs: Crumb[]; start?: ReactNode; children?: ReactNode };

function Brand() {
  return (
    <Link
      to="/projects"
      className="flex items-center gap-1.5 text-[15px] font-semibold text-text no-underline"
    >
      <Logo />
      Geomind
    </Link>
  );
}

function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumb aria-label="Breadcrumb" className="min-w-0 max-[720px]:hidden">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.label}>
            {index === 0 ? null : <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.to === undefined && index === crumbs.length - 1 ? (
                <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
              ) : crumb.to === undefined ? (
                crumb.label
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.to} className="text-muted no-underline">
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

/** The top bar of every signed-in page: brand (or a sidebar trigger), breadcrumb, optional pills, user menu. */
export function TopBar({ crumbs, start, children }: Props) {
  return (
    <header className="flex min-h-14 flex-wrap items-center gap-2.5 border-b border-border bg-background px-4 py-2 lg:px-6">
      {start ?? <Brand />}
      <Crumbs crumbs={crumbs} />
      <div className="flex-1" />
      {children}
      <UserMenu />
    </header>
  );
}
