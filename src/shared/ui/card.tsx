import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** A bordered surface; compose with CardHeader and CardBody. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-w-0 rounded-card border border-border bg-surface", className)}
      {...rest}
    />
  );
}

/** The card title row with a bottom border. */
export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5",
        className,
      )}
      {...rest}
    />
  );
}

/** The card content area. */
export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-3", className)} {...rest} />;
}
