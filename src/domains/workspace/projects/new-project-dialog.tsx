import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { showToast } from "@/shared/ui/toast";
import { useCreateProject, useImportProject } from "./api";

type Source = "empty" | "zip";

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
        An empty problem
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

function NewProjectForm() {
  const navigate = useNavigate();
  const [source, setSource] = useState<Source>("empty");
  const create = useCreateProject();
  const importZip = useImportProject();
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
    if (source === "empty" && typeof name === "string") {
      create.mutate({ name: name.trim() }, { onSuccess: handleCreated });
    }
    if (source === "zip" && file instanceof File) {
      importZip.mutate(file, { onSuccess: handleCreated });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <SourceChoice source={source} onChange={setSource} />
      {source === "empty" ? (
        <Field label="Name" htmlFor="project-name">
          <Input id="project-name" name="name" required />
        </Field>
      ) : (
        <Field label="Project zip" htmlFor="project-zip">
          <Input id="project-zip" name="file" type="file" accept=".zip" required />
        </Field>
      )}
      {error === null ? null : (
        <p role="alert" className="text-bad">
          {error.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button>Cancel</Button>
        </DialogClose>
        <Button type="submit" variant="primary" disabled={create.isPending || importZip.isPending}>
          Create
        </Button>
      </div>
    </form>
  );
}

/** The New project dialog: a name for an empty problem, or a project zip to import. */
export function NewProjectDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="New project">
        <NewProjectForm />
      </DialogContent>
    </Dialog>
  );
}
