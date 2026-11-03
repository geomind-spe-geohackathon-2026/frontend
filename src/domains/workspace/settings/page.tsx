import { useQuery } from "@tanstack/react-query";
import { toFieldMessage } from "@/shared/api/errors";
import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { projectQuery } from "@/shared/api/projects";
import type { Project } from "@/shared/api/types";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDeleteProject, useExportProject, useRenameProject, useSetBudget } from "./api";
import { startDownload } from "./download";
import { Notice } from "@/shared/ui/notice";

function RenameForm({ project }: { project: Project }) {
  const rename = useRenameProject(project.id);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    if (typeof name !== "string" || name.trim() === "") return;
    rename.mutate(name.trim(), {
      onSuccess: () => {
        toast("Project renamed");
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="project-name">Name</FieldLabel>
        <Input id="project-name" name="name" defaultValue={project.name} required />
      </Field>
      {rename.error === null ? null : (
        <p role="alert" className="text-bad">
          {toFieldMessage(rename.error)}
        </p>
      )}
      <Button type="submit" variant="default" disabled={rename.isPending} className="self-start">
        Save name
      </Button>
    </form>
  );
}

function toCap(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return Number(value);
}

function BudgetForm({ project }: { project: Project }) {
  const setBudget = useSetBudget(project.id);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const budget = {
      max_tokens: toCap(form.get("max_tokens")),
      max_cost: toCap(form.get("max_cost")),
    };
    setBudget.mutate(budget, {
      onSuccess: () => {
        toast("Budget saved");
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <b>Assistant budget</b>
        <p className="text-muted">
          The assistant stops once the project reaches a cap. Empty means no cap.
        </p>
      </div>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="project-max-tokens">Token cap</FieldLabel>
        <Input
          id="project-max-tokens"
          name="max_tokens"
          type="number"
          min="1"
          step="1"
          defaultValue={project.budget.max_tokens ?? ""}
        />
      </Field>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="project-max-cost">Cost cap (USD)</FieldLabel>
        <Input
          id="project-max-cost"
          name="max_cost"
          type="number"
          min="0"
          step="any"
          defaultValue={project.budget.max_cost ?? ""}
        />
      </Field>
      {setBudget.error === null ? null : (
        <p role="alert" className="text-bad">
          {toFieldMessage(setBudget.error)}
        </p>
      )}
      <Button type="submit" disabled={setBudget.isPending} className="self-start">
        Save budget
      </Button>
    </form>
  );
}

function ExportRow({ project }: { project: Project }) {
  const exportZip = useExportProject(project.id);
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <b>Export zip</b>
        <p className="text-muted">The project with its plant and case versions.</p>
        {exportZip.error === null ? null : <p role="alert">{exportZip.error.message}</p>}
      </div>
      <Button
        disabled={exportZip.isPending}
        onClick={() => {
          exportZip.mutate(undefined, {
            onSuccess: (blob) => {
              startDownload(blob, `${project.name}.zip`);
              toast(`${project.name}.zip exported`);
            },
          });
        }}
      >
        Export zip
      </Button>
    </div>
  );
}

function DeleteRow({ project }: { project: Project }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteProject(project.id);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <b>Delete project</b>
          <p className="text-muted">Removes the project and everything in it.</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => {
            setConfirming(true);
          }}
        >
          Delete project
        </Button>
      </div>
      {confirming ? (
        <div
          role="alertdialog"
          aria-label="Confirm delete"
          className="flex flex-wrap items-center gap-2 rounded-control border border-bad bg-bad-soft p-2.5"
        >
          <span className="flex-1">This cannot be undone.</span>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(undefined, {
                onSuccess: () => {
                  toast("Project deleted");
                  void navigate("/projects");
                },
              });
            }}
          >
            Yes, delete
          </Button>
          <Button
            onClick={() => {
              setConfirming(false);
            }}
          >
            Keep it
          </Button>
        </div>
      ) : null}
      {remove.error === null ? null : (
        <p role="alert" className="text-bad">
          {remove.error.message}
        </p>
      )}
    </div>
  );
}

/** The settings of one project: rename, the assistant budget, export as a zip, and delete with a confirmation. */
export function SettingsBody({ projectId }: { projectId: string }) {
  const project = useQuery(projectQuery(projectId));
  if (project.isPending) return <Notice status="loading" what="the project" />;
  if (project.isError) return <p role="alert">{project.error.message}</p>;
  return (
    <div className="flex flex-col gap-5">
      <RenameForm key={project.data.updated} project={project.data} />
      <BudgetForm key={`budget-${project.data.updated}`} project={project.data} />
      <ExportRow project={project.data} />
      <DeleteRow project={project.data} />
    </div>
  );
}

/** Project settings as a window over the current page, opened from the project's menu in the sidebar. */
export function SettingsDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100svh-4rem)] flex-col gap-4 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Project settings</DialogTitle>
          <DialogDescription>Name, assistant budget, export and delete.</DialogDescription>
        </DialogHeader>
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 pb-1">
          <SettingsBody projectId={projectId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The project settings route, for a direct link; the sidebar opens the same settings as a window. */
export function SettingsPage() {
  const projectId = useRequiredParam("projectId");
  return (
    <div className="flex w-[min(600px,100%)] flex-col gap-3.5">
      <PageHeader title="Project settings" />
      <Card>
        <CardContent>
          <SettingsBody projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
