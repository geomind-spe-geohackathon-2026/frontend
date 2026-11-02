import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { DialogClose } from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Notice } from "@/shared/ui/notice";
import { SchemaForm } from "@/shared/forms/schema-form";
import { isRecord, type Problem } from "@/shared/forms/json-schema";
import { findMissing } from "@/shared/forms/missing";
import type { NewStudy, StudyKind } from "@/shared/api/design";

type Props = {
  projectId: string;
  kinds: StudyKind[];
  error: unknown;
  pending: boolean;
  onSubmit: (input: NewStudy) => void;
};

function KindSelect({
  kinds,
  value,
  onValue,
}: {
  kinds: StudyKind[];
  value: string;
  onValue: (value: string) => void;
}) {
  return (
    <Field label="Kind" htmlFor="study-kind">
      <select
        id="study-kind"
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        className="w-full rounded-control border border-border bg-surface px-2.5 py-[7px]"
      >
        <option value="">Choose a kind</option>
        {kinds.map((entry) => (
          <option key={entry.kind} value={entry.kind}>
            {entry.title}
          </option>
        ))}
      </select>
    </Field>
  );
}

function NameField({ value, onValue }: { value: string; onValue: (value: string) => void }) {
  return (
    <Field label="Name" htmlFor="study-name">
      <Input
        id="study-name"
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
      />
    </Field>
  );
}

/** The body of the New study dialog: kind, name and the settings its schema asks for. */
export function NewStudyForm({ projectId, kinds, error, pending, onSubmit }: Props) {
  const [kind, setKind] = useState("");
  const [name, setName] = useState("");
  const [value, setValue] = useState<unknown>({});
  const [problems, setProblems] = useState<Problem[]>([]);
  const selected = kinds.find((entry) => entry.kind === kind) ?? null;
  const ready =
    selected !== null &&
    name.trim() !== "" &&
    problems.length === 0 &&
    findMissing(selected.schema, value).length === 0;

  function handleKind(next: string): void {
    setKind(next);
    setValue({});
    setProblems([]);
  }

  function handleSubmit(): void {
    if (!ready) return;
    onSubmit({
      project: projectId,
      kind,
      name: name.trim(),
      settings: isRecord(value) ? value : {},
    });
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <KindSelect kinds={kinds} value={kind} onValue={handleKind} />
      {selected === null ? null : <p className="text-muted">{selected.description}</p>}
      <NameField value={name} onValue={setName} />
      {selected === null ? null : (
        <SchemaForm
          key={selected.kind}
          schema={selected.schema}
          initial={{}}
          onChange={(nextValue, nextProblems) => {
            setValue(nextValue);
            setProblems(nextProblems);
          }}
        />
      )}
      {error === null ? null : <Notice status="failed" error={error} />}
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button>Cancel</Button>
        </DialogClose>
        <Button type="submit" variant="primary" disabled={!ready || pending}>
          Create study
        </Button>
      </div>
    </form>
  );
}
