import { useInfiniteQuery } from "@tanstack/react-query";
import { toFieldMessage } from "@/shared/api/errors";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toItems } from "@/shared/api/pagination";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { showToast } from "@/shared/ui/toast";
import { projectsQuery, useCreateProject, useImportProject } from "./api";

type Source = "empty" | "copy" | "zip";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

function SourceChoice({
  source,
  onChange,
}: {
  source: Source;
  onChange: (source: Source) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-[12.5px] text-muted">Start from</legend>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="source"
          checked={source === "empty"}
          onChange={() => {
            onChange("empty");
          }}
        />
        An empty case
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="source"
          checked={source === "copy"}
          onChange={() => {
            onChange("copy");
          }}
        />
        A copy of another project&apos;s case
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="source"
          checked={source === "zip"}
          onChange={() => {
            onChange("zip");
          }}
        />
        A project zip
      </label>
    </fieldset>
  );
}

function CopyPicker() {
  const projects = useInfiniteQuery(projectsQuery(""));
  const items = toItems(projects.data?.pages);
  return (
    <Field label="Project to copy" htmlFor="project-copy">
      <select
        id="project-copy"
        name="case_from"
        required
        className="w-full rounded-control border border-border bg-surface px-2.5 py-[7px]"
      >
        <option value="" />
        {items.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function NameProblem() {
  return (
    <p role="alert" className="text-bad">
      Enter a name for the project.
    </p>
  );
}

function FormButtons({ pending }: { pending: boolean }) {
  return (
    <div className="flex justify-end gap-2">
      <DialogClose asChild>
        <Button>Cancel</Button>
      </DialogClose>
      <Button type="submit" variant="primary" disabled={pending}>
        Create
      </Button>
    </div>
  );
}

function NewProjectForm() {
  const navigate = useNavigate();
  const [source, setSource] = useState<Source>("empty");
  const create = useCreateProject();
  const importZip = useImportProject();
  const [nameMissing, setNameMissing] = useState(false);
  const error = create.error ?? importZip.error;

  function handleCreated(project: { id: string }) {
    showToast("Project created");
    void navigate(`/projects/${project.id}/overview`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name");
    const file = form.get("file");
    const caseFrom = form.get("case_from");
    const isBlank = source !== "zip" && typeof name === "string" && name.trim() === "";
    setNameMissing(isBlank);
    if (isBlank) return;
    if (source === "empty" && typeof name === "string") {
      create.mutate({ name: name.trim() }, { onSuccess: handleCreated });
    }
    if (source === "copy" && typeof name === "string" && typeof caseFrom === "string") {
      create.mutate({ name: name.trim(), case_from: caseFrom }, { onSuccess: handleCreated });
    }
    if (source === "zip" && file instanceof File) {
      importZip.mutate(file, { onSuccess: handleCreated });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <SourceChoice source={source} onChange={setSource} />
      {source === "zip" ? (
        <Field label="Project zip" htmlFor="project-zip">
          <Input id="project-zip" name="file" type="file" accept=".zip" required />
        </Field>
      ) : (
        <>
          <Field label="Name" htmlFor="project-name">
            <Input id="project-name" name="name" />
          </Field>
          {nameMissing ? <NameProblem /> : null}
          {source === "copy" ? <CopyPicker /> : null}
        </>
      )}
      {error === null ? null : (
        <p role="alert" className="text-bad">
          {toFieldMessage(error)}
        </p>
      )}
      <FormButtons pending={create.isPending || importZip.isPending} />
    </form>
  );
}

/** The New project dialog: a name for an empty problem or for a copy of another project's case, or a project zip to import. */
export function NewProjectDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="New project">
        <NewProjectForm />
      </DialogContent>
    </Dialog>
  );
}
