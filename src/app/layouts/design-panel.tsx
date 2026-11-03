import { Outlet, useNavigate } from "react-router-dom";
import { Maximize2, Minimize2, X } from "lucide-react";
import { designItems, type NavItem } from "@/app/nav";
import type { Project } from "@/shared/api/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MissingBadge, StatusDot, useStepProgress } from "./progress";

type Props = {
  project: Project;
  current: NavItem;
  chatId: string | null;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
};

function Steps({ project, current, chatId }: Pick<Props, "project" | "current" | "chatId">) {
  const navigate = useNavigate();
  const progress = useStepProgress(project);
  return (
    <Tabs
      value={current.to}
      onValueChange={(to) => {
        const chat = chatId === null ? "" : `?chat=${chatId}`;
        void navigate(`/projects/${project.id}/${to}${chat}`);
      }}
      className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <TabsList aria-label="Design steps">
        {designItems.map((item) => {
          const step = item.progress === undefined ? undefined : progress(item.progress);
          return (
            <TabsTrigger key={item.to} value={item.to}>
              {item.label}
              {step === undefined ? null : <MissingBadge step={step} />}
              {step === undefined ? null : <StatusDot step={step} />}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

/** The Design panel next to the chat: its title, the design steps as tabs, Expand and Close, and the open step. */
export function DesignPanel({ project, current, chatId, expanded, onExpand, onClose }: Props) {
  return (
    <section aria-label="Design" className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <div className="flex h-12 flex-none items-center gap-2 border-b px-3">
        <h2 className="flex-none pr-1 text-sm font-semibold">Design</h2>
        <Steps project={project} current={current} chatId={chatId} />
        <div className="flex-1" />
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
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </div>
    </section>
  );
}
