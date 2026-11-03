import type { ReactNode } from "react";

type Props = { title: string; description?: string; actions?: ReactNode };

/** The page title row: the one h1 of a page, an optional description and action buttons. */
export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div>
        <h1 className="tracking-tight">{title}</h1>
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
