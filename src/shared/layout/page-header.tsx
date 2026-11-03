import type { ReactNode } from "react";

type Props = { title: string; badge?: ReactNode; description?: string; actions?: ReactNode };

/** The page title row: the one h1 of a page with an optional badge beside it, an optional description and action buttons. */
export function PageHeader({ title, badge, description, actions }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="tracking-tight">{title}</h1>
          {badge}
        </div>
        {description === undefined ? null : (
          <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions === undefined ? null : (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
