import { useInfiniteQuery } from "@tanstack/react-query";
import { toFieldMessage } from "@/shared/api/errors";
import { useRef, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X } from "lucide-react";
import { toItems } from "@/shared/api/pagination";
import { toDropProps } from "@/shared/attach/attach-files";
import { keepDraft } from "@/shared/attach/chat-draft";
import { uploadDocument } from "@/shared/attach/upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { projectsQuery, useCreateProject, useImportProject } from "./api";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Source = "empty" | "copy" | "zip";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const sources: { value: Source; label: string }[] = [
  { value: "empty", label: "Empty case" },
  { value: "copy", label: "Copy a case" },
  { value: "zip", label: "Project zip" },
];

function isSource(value: string): value is Source {
  return sources.some((source) => source.value === value);
}

function SourceChoice({
  source,
  onChange,
}: {
  source: Source;
  onChange: (source: Source) => void;
}) {
  return (
    <Field className="gap-1.5">
      <FieldLabel id="project-source">Start from</FieldLabel>
      <Tabs
        value={source}
        onValueChange={(value) => {
          if (isSource(value)) onChange(value);
        }}
      >
        <TabsList aria-labelledby="project-source">
          {sources.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </Field>
  );
}

function CopyPicker() {
  const projects = useInfiniteQuery(projectsQuery(""));
  const items = toItems(projects.data?.pages);
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor="project-copy">Project to copy</FieldLabel>
      <NativeSelect id="project-copy" name="case_from" required className="w-full">
        <NativeSelectOption value="" />
        {items.map((project) => (
          <NativeSelectOption key={project.id} value={project.id}>
            {project.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

function FileList({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  if (files.length === 0) return null;
  return (
    <ul aria-label="Context files" className="flex flex-wrap gap-2">
      {files.map((file) => (
        <li
          key={file.name}
          className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm"
        >
          <span className="max-w-56 truncate">{file.name}</span>
          <button
            type="button"
            aria-label={`Remove ${file.name}`}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              onChange(files.filter((item) => item !== file));
            }}
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function ContextFiles({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const add = (added: File[]) => {
    const known = new Set(files.map((file) => file.name));
    onChange([...files, ...added.filter((file) => !known.has(file.name))]);
  };
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor="project-files">Context files (optional)</FieldLabel>
      <div
        className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground"
        {...toDropProps(add)}
      >
        <Upload aria-hidden="true" className="size-5" />
        <span>
          Drop files here or{" "}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
            onClick={() => {
              input.current?.click();
            }}
          >
            browse
          </button>
        </span>
        <input
          ref={input}
          id="project-files"
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            add([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      </div>
      <FieldDescription>
        Data, reports and papers go to the project&apos;s Library.
      </FieldDescription>
      <FileList files={files} onChange={onChange} />
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
      <Button type="submit" variant="default" disabled={pending}>
        Create
      </Button>
    </div>
  );
}

function useAfterCreate(files: File[], onClose: () => void) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  return {
    uploading,
    done: async (project: { id: string }, goal: string) => {
      keepDraft(project.id, goal);
      setUploading(true);
      const results = await Promise.allSettled(
        files.map((file) => uploadDocument(project.id, file)),
      );
      setUploading(false);
      onClose();
      const failed = results.filter((result) => result.status === "rejected").length;
      toast(failed === 0 ? "Project created" : `Project created; ${String(failed)} files failed`);
      void navigate(`/projects/${project.id}`);
    },
  };
}

function NameFields({ source, nameMissing }: { source: Source; nameMissing: boolean }) {
  return (
    <>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="project-name">Name</FieldLabel>
        <Input id="project-name" name="name" placeholder="Name your project" />
      </Field>
      {nameMissing ? <NameProblem /> : null}
      {source === "copy" ? <CopyPicker /> : null}
      <Field className="gap-1.5">
        <FieldLabel htmlFor="project-goal">What do you want to work on? (optional)</FieldLabel>
        <Textarea
          id="project-goal"
          name="goal"
          rows={3}
          placeholder="For example: design heating and cooling for a campus from a geothermal doublet"
        />
        <FieldDescription>It waits in the first chat; you send it.</FieldDescription>
      </Field>
    </>
  );
}

function NewProjectForm({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState<Source>("empty");
  const [files, setFiles] = useState<File[]>([]);
  const create = useCreateProject();
  const importZip = useImportProject();
  const after = useAfterCreate(files, onClose);
  const [nameMissing, setNameMissing] = useState(false);
  const error = create.error ?? importZip.error;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name");
    const goal = form.get("goal");
    const file = form.get("file");
    const caseFrom = form.get("case_from");
    const isBlank = source !== "zip" && typeof name === "string" && name.trim() === "";
    setNameMissing(isBlank);
    if (isBlank) return;
    const onSuccess = (project: { id: string }) =>
      void after.done(project, typeof goal === "string" ? goal : "");
    if (source === "empty" && typeof name === "string") {
      create.mutate({ name: name.trim() }, { onSuccess });
    }
    if (source === "copy" && typeof name === "string" && typeof caseFrom === "string") {
      create.mutate({ name: name.trim(), case_from: caseFrom }, { onSuccess });
    }
    if (source === "zip" && file instanceof File) {
      importZip.mutate(file, { onSuccess });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SourceChoice source={source} onChange={setSource} />
      {source === "zip" ? (
        <Field className="gap-1.5">
          <FieldLabel htmlFor="project-zip">Project zip</FieldLabel>
          <Input id="project-zip" name="file" type="file" accept=".zip" required />
        </Field>
      ) : (
        <NameFields source={source} nameMissing={nameMissing} />
      )}
      <ContextFiles files={files} onChange={setFiles} />
      {error === null ? null : (
        <p role="alert" className="text-bad">
          {toFieldMessage(error)}
        </p>
      )}
      <FormButtons pending={create.isPending || importZip.isPending || after.uploading} />
    </form>
  );
}

/** The New project dialog: a name, what to work on and context files, for an empty case, a copy of another project's case, or a project zip. */
export function NewProjectDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Name the project, say what you want to work on and add the files it should know.
          </DialogDescription>
        </DialogHeader>
        <NewProjectForm
          onClose={() => {
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
