import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "ok" | "warn" | "bad" | "info" | "off";

type Props = HTMLAttributes<HTMLSpanElement> & { tone: Tone };

const tones: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-accent-soft text-accent",
  off: "border border-border bg-surface text-muted",
};

/** A status chip: the text carries the meaning, the tone only supports it. */
export function Chip({ tone, className, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill px-2 py-px text-[11.5px] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
