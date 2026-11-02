import type { ReactNode } from "react";

type Props = { label: string; htmlFor: string; children: ReactNode };

/** A visible label above a control; the control carries the matching id. */
export function Field({ label, htmlFor, children }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-[12.5px] text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
