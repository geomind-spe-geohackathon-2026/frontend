import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/shared/ui/notice";
import { ConfigEditor } from "@/shared/forms/config-editor";
import { isRecord, type Problem } from "@/shared/forms/json-schema";
import { findMissing } from "@/shared/forms/missing";
import type { Study, StudyCreate, StudyKind } from "@/shared/api/types";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Props = {
  projectId: string;
  kinds: StudyKind[];
  error: unknown;
  pending: boolean;
  onSubmit: (input: StudyCreate) => void;
  template?: Study | null;
};

function toTemplateSettings(
  kind: StudyKind | undefined,
  template: Study | null,
): Record<string, unknown> {
  if (kind === undefined || template === null) return {};
  const known = new Set(Object.keys(kind.schema.properties ?? {}));
  return Object.fromEntries(Object.entries(template.settings).filter(([key]) => known.has(key)));
}

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
export function NewStudyForm({
  projectId,
  kinds,
  error,
  pending,
  onSubmit,
  template = null,
}: Props) {
  const templateKind = kinds.find((entry) => entry.kind === template?.kind);
  const [initial] = useState(() => toTemplateSettings(templateKind, template));
  const [kind, setKind] = useState(templateKind?.kind ?? "");
  const [name, setName] = useState(template === null ? "" : `${template.name} again`);
  const [plantVersion, setPlantVersion] = useState(
    template?.plant_version === null || template?.plant_version === undefined
      ? ""
      : String(template.plant_version),
  );
  const [value, setValue] = useState<unknown>(initial);
  const [problems, setProblems] = useState<Problem[]>([]);
  const selected = kinds.find((entry) => entry.kind === kind) ?? null;
  const missing = selected === null ? [] : findMissing(selected.schema, value);
  const ready =
    selected !== null && name.trim() !== "" && problems.length === 0 && missing.length === 0;

  const isTemplateKind = templateKind !== undefined && kind === templateKind.kind;

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
      ...(plantVersion.trim() === "" ? {} : { plant_version: Number(plantVersion) }),
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
        <ConfigEditor
          key={selected.kind}
          jsonLabel="JSON of the study settings"
          schema={selected.schema}
          initial={isTemplateKind ? initial : {}}
          missing={missing}
          onChange={(nextValue, nextProblems) => {
            setValue(nextValue);
            setProblems(nextProblems);
          }}
        />
      )}
      {template === null ? null : (
        <Field className="gap-1.5">
          <FieldLabel htmlFor="study-plant-version">Plant version</FieldLabel>
          <Input
            id="study-plant-version"
            type="number"
            min={1}
            step={1}
            placeholder="the current plant"
            value={plantVersion}
            onChange={(event) => {
              setPlantVersion(event.target.value);
            }}
          />
          <p className="text-[12px] text-muted">
            The plant version {template.name} ran on; empty runs on the current plant.
          </p>
        </Field>
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
