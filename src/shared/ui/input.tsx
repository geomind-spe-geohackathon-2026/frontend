import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** A text input with the shared border, radius and warning state through aria-invalid. */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-control border border-border bg-surface px-2.5 py-[7px] aria-invalid:border-warn",
        className,
      )}
      {...rest}
    />
  );
}
