import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

type SectionProps = { title: string; action?: ReactNode; children: ReactNode };

/** A sidebar section whose title opens and closes it, with an optional action beside the title. */
export function SidebarSection({ title, action, children }: SectionProps) {
  return (
    <Collapsible defaultOpen className="group/section">
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild className="cursor-pointer gap-1 hover:text-sidebar-foreground">
          <CollapsibleTrigger>
            <span className="min-w-0 truncate">{title}</span>
            <ChevronRight
              aria-hidden="true"
              className="opacity-0 transition-[transform,opacity] group-hover/section:opacity-100 group-data-[state=open]/section:rotate-90"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        {action}
        <CollapsibleContent>{children}</CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
