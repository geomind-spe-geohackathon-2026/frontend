import type { ReactNode } from "react";

type Props = { title: string; description?: string; actions?: ReactNode };

/** The page title row: the one h1 of a page, an optional description and action buttons. */
export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div>
        <h1>{title}</h1>
        {description === undefined ? null : (
          <p className="mt-0.5 max-w-[70ch] text-muted">{description}</p>
        )}
      </div>
      {actions === undefined ? null : (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
