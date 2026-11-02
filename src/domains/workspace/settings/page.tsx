import { useQuery } from "@tanstack/react-query";
import { toFieldMessage } from "@/shared/api/errors";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { projectQuery } from "@/shared/api/projects";
import type { Project } from "@/shared/api/types";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/shared/ui/button";
import { Card, CardBody } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { showToast } from "@/shared/ui/toast";
import { useDeleteProject, useExportProject, useRenameProject, useSetBudget } from "./api";
import { startDownload } from "./download";

function RenameForm({ project }: { project: Project }) {
  const rename = useRenameProject(project.id);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    if (typeof name !== "string" || name.trim() === "") return;
    rename.mutate(name.trim(), {
      onSuccess: () => {
        showToast("Project renamed");
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Name" htmlFor="project-name">
        <Input id="project-name" name="name" defaultValue={project.name} required />
      </Field>
      {rename.error === null ? null : (
        <p role="alert" className="text-bad">
          {toFieldMessage(rename.error)}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={rename.isPending} className="self-start">
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const budget = {
      max_tokens: toCap(form.get("max_tokens")),
      max_cost: toCap(form.get("max_cost")),
    };
    setBudget.mutate(budget, {
      onSuccess: () => {
        showToast("Budget saved");
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
      <Field label="Token cap" htmlFor="project-max-tokens">
        <Input
          id="project-max-tokens"
          name="max_tokens"
          type="number"
          min="1"
          step="1"
          defaultValue={project.budget.max_tokens ?? ""}
        />
      </Field>
      <Field label="Cost cap (USD)" htmlFor="project-max-cost">
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
        <p className="text-muted">The project with its plant and problem versions.</p>
        {exportZip.error === null ? null : <p role="alert">{exportZip.error.message}</p>}
      </div>
      <Button
        disabled={exportZip.isPending}
        onClick={() => {
          exportZip.mutate(undefined, {
            onSuccess: (blob) => {
              startDownload(blob, `${project.name}.zip`);
              showToast(`${project.name}.zip exported`);
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
          variant="danger"
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
            variant="danger"
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(undefined, {
                onSuccess: () => {
                  showToast("Project deleted");
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

/** Project settings: rename, the assistant budget, export as a zip, and delete with an in-page confirmation. */
export function SettingsPage() {
  const projectId = useRequiredParam("projectId");
  const project = useQuery(projectQuery(projectId));

  return (
    <div className="flex w-[min(600px,100%)] flex-col gap-3.5">
      <PageHeader title="Project settings" />
      {project.isPending ? <p role="status">Loading the project</p> : null}
      {project.isError ? <p role="alert">{project.error.message}</p> : null}
      {project.data === undefined ? null : (
        <Card>
          <CardBody className="flex flex-col gap-5">
            <RenameForm key={project.data.updated} project={project.data} />
            <BudgetForm key={`budget-${project.data.updated}`} project={project.data} />
            <ExportRow project={project.data} />
            <DeleteRow project={project.data} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
