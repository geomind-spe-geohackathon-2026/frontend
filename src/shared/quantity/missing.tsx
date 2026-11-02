import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = { blocks: string; className?: string };

/** Renders an absent value in the warning colour with the word "missing" and what it blocks. */
export function Missing({ blocks, className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <TriangleAlert aria-hidden="true" className="size-3.5 text-warn" />
      <span className="font-medium text-warn">missing</span>
      <span className="text-muted">blocks {blocks}</span>
    </span>
  );
}
