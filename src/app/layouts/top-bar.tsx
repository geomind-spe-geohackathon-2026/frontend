import { Logo } from "@/shared/ui/logo";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Crumb } from "@/app/nav";
import { UserMenu } from "./user-menu";

type Props = { crumbs: Crumb[]; children?: ReactNode };

/** The top bar of every signed-in page: brand, breadcrumb, optional pills, user menu. */
export function TopBar({ crumbs, children }: Props) {
  return (
    <header className="flex min-h-[50px] flex-wrap items-center gap-2.5 border-b border-border bg-surface px-4 py-2">
      <Link
        to="/projects"
        className="flex items-center gap-1.5 text-[15px] font-semibold text-text no-underline"
      >
        <Logo />
        Geomind
      </Link>
      <nav aria-label="Breadcrumb" className="max-[720px]:hidden">
        <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-muted">
          {crumbs.map((crumb, index) => (
            <li key={crumb.label} className="flex items-center gap-1.5">
              {index === 0 ? null : <span aria-hidden="true">/</span>}
              {crumb.to === undefined ? (
                <span
                  aria-current={index === crumbs.length - 1 ? "page" : undefined}
                  className={index === crumbs.length - 1 ? "font-medium text-text" : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="rounded px-1 text-muted no-underline hover:bg-sunken hover:text-text"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex-1" />
      {children}
      <UserMenu />
    </header>
  );
}
