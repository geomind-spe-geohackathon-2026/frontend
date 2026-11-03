import { useState, type ReactNode, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Ellipsis } from "lucide-react";
import { useRenameProject } from "@/domains/workspace/settings/api";
import { isPinned, togglePin, usePins } from "@/shared/layout/pins";
import type { Project } from "@/shared/api/types";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel } from "@/components/ui/sidebar";

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

function RenameDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const rename = useRenameProject(project.id);
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    if (typeof name !== "string" || name.trim() === "") return;
    rename.mutate(name.trim(), { onSuccess: onClose });
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="rename-project">Name</FieldLabel>
            <Input id="rename-project" name="name" defaultValue={project.name} />
          </Field>
          {rename.error === null ? null : (
            <p role="alert" className="text-bad">
              {rename.error.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="default" disabled={rename.isPending}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The project's "…" menu beside its name in the sidebar: Pin, Rename and Settings. */
export function ProjectMenu({ project }: { project: Project }) {
  const navigate = useNavigate();
  const pins = usePins();
  const pinned = isPinned(pins, "project", project.id);
  const [renaming, setRenaming] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarGroupAction aria-label={`Actions of ${project.name}`}>
            <Ellipsis aria-hidden="true" />
          </SidebarGroupAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            onClick={() => {
              togglePin({
                kind: "project",
                id: project.id,
                projectId: project.id,
                title: project.name,
              });
            }}
          >
            {pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setRenaming(true);
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void navigate(`/projects/${project.id}/settings`);
            }}
          >
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {renaming ? (
        <RenameDialog
          project={project}
          onClose={() => {
            setRenaming(false);
          }}
        />
      ) : null}
    </>
  );
}
