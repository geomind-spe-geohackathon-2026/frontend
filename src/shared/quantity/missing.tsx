import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = { blocks: string; compact?: boolean; className?: string };

/** Renders an absent value in the warning colour with the word "missing" and what it blocks; the compact form keeps what it blocks in a tooltip. */
export function Missing({ blocks, compact = false, className }: Props) {
  return (
    <span
      title={compact ? `blocks ${blocks}` : undefined}
      className={cn("inline-flex items-center gap-1", className)}
    >
      <TriangleAlert aria-hidden="true" className="size-3.5 text-warn" />
      <span className="font-medium text-warn">missing</span>
      {compact ? null : <span className="text-muted">blocks {blocks}</span>}
    </span>
  );
}
