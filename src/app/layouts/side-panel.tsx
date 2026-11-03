import type { ReactNode } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  children: ReactNode;
};

/** The panel beside the chat that holds a project page, with only expand and close in its header. */
export function SidePanel({ label, expanded, onExpand, onClose, children }: Props) {
  return (
    <section aria-label={label} className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <div className="flex h-11 flex-none items-center gap-1 border-b px-4">
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={expanded ? "Show the chat again" : "Expand"}
          title={expanded ? "Show the chat again" : "Expand"}
          onClick={onExpand}
        >
          {expanded ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close" title="Close" onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
    </section>
  );
}
