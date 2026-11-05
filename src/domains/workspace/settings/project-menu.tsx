import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Ellipsis } from "lucide-react";
import { toast } from "sonner";
import { isPinned, togglePin, usePins } from "@/shared/layout/pins";
import type { Project } from "@/shared/api/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { SidebarGroupAction } from "@/components/ui/sidebar";
import { useDeleteProject, useRenameProject } from "./api";
import { SettingsDialog } from "./page";

type Place = "sidebar" | "card";

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

function DeleteDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const navigate = useNavigate();
  const remove = useDeleteProject(project.id);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {project.name}?</DialogTitle>
          <DialogDescription>
            This removes the project &ldquo;{project.name}&rdquo; and everything in it: its case,
            plant, studies, results, chats and files. It cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {remove.error === null ? null : (
          <p role="alert" className="text-bad">
            {remove.error.message}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button>Keep it</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(undefined, {
                onSuccess: () => {
                  onClose();
                  toast(`Project ${project.name} deleted`);
                  void navigate("/projects");
                },
              });
            }}
          >
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MenuTrigger({ project, place }: { project: Project; place: Place }) {
  const label = `Actions of ${project.name}`;
  if (place === "sidebar") {
    return (
      <DropdownMenuTrigger asChild>
        <SidebarGroupAction aria-label={label}>
          <Ellipsis aria-hidden="true" />
        </SidebarGroupAction>
      </DropdownMenuTrigger>
    );
  }
  return (
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        className="relative z-10 text-muted-foreground"
      >
        <Ellipsis aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
  );
}

/** A project's "…" menu, the same in the sidebar and on the project cards: Pin, Rename, Settings and Delete (after a confirmation naming the project). */
export function ProjectMenu({ project, place = "card" }: { project: Project; place?: Place }) {
  const pins = usePins();
  const pinned = isPinned(pins, "project", project.id);
  const [open, setOpen] = useState<"rename" | "settings" | "delete" | null>(null);
  const close = () => {
    setOpen(null);
  };
  return (
    <>
      <DropdownMenu>
        <MenuTrigger project={project} place={place} />
        <DropdownMenuContent
          side={place === "sidebar" ? "right" : "bottom"}
          align={place === "sidebar" ? "start" : "end"}
        >
          <DropdownMenuItem
            onClick={() => {
              togglePin({ kind: "project", id: project.id, projectId: project.id, title: project.name });
            }}
          >
            {pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setOpen("rename");
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setOpen("settings");
            }}
          >
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setOpen("delete");
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {open === "rename" ? <RenameDialog project={project} onClose={close} /> : null}
      {open === "delete" ? <DeleteDialog project={project} onClose={close} /> : null}
      <SettingsDialog
        projectId={project.id}
        open={open === "settings"}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      />
    </>
  );
}
