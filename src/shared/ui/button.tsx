import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "primary" | "danger" | "link";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; asChild?: boolean };

const variants: Record<Variant, string> = {
  default: "border-border bg-surface hover:border-muted",
  primary: "border-accent bg-accent text-on-accent",
  danger: "border-bad bg-surface text-bad",
  link: "border-transparent bg-transparent p-0 text-accent",
};

/** The one button: default, primary, danger or link look; asChild styles a link as a button. */
export function Button({ variant = "default", asChild = false, className, type, ...rest }: Props) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "inline-flex items-center gap-2 rounded-control border px-3 py-1.5 text-[13px] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...rest}
    />
  );
}
