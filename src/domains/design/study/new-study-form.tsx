import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/shared/ui/notice";
import { SchemaForm } from "@/shared/forms/schema-form";
import { isRecord, type Problem } from "@/shared/forms/json-schema";
import { findMissing } from "@/shared/forms/missing";
import type { StudyCreate, StudyKind } from "@/shared/api/types";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Props = {
  projectId: string;
  kinds: StudyKind[];
  error: unknown;
  pending: boolean;
  onSubmit: (input: StudyCreate) => void;
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
    <Field className="gap-1.5">
      <FieldLabel htmlFor="study-kind">Kind</FieldLabel>
      <NativeSelect
        id="study-kind"
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        className="w-full"
      >
        <NativeSelectOption value="">Choose a kind</NativeSelectOption>
        {kinds
          .filter((entry) => entry.use === "method")
          .map((entry) => (
            <NativeSelectOption key={entry.kind} value={entry.kind}>
              {entry.title}
            </NativeSelectOption>
          ))}
      </NativeSelect>
    </Field>
  );
}

function NameField({ value, onValue }: { value: string; onValue: (value: string) => void }) {
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor="study-name">Name</FieldLabel>
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
  const missing = selected === null ? [] : findMissing(selected.schema, value);
  const ready =
    selected !== null && name.trim() !== "" && problems.length === 0 && missing.length === 0;

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
          missing={missing}
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
        <Button type="submit" variant="default" disabled={!ready || pending}>
          Create study
        </Button>
      </div>
    </form>
  );
}
