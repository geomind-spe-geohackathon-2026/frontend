import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { DialogClose } from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Notice } from "@/shared/ui/notice";
import { SchemaForm } from "@/shared/forms/schema-form";
import { isRecord, type Problem } from "@/shared/forms/json-schema";
import { findMissing } from "@/shared/forms/missing";
import type { StudyCreate, StudyKind } from "@/shared/api/types";

/** A saved plant version a study can run on. */
export type PlantChoice = { number: number; note: string };

type Props = {
  projectId: string;
  kinds: StudyKind[];
  plants?: PlantChoice[] | undefined;
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
        {kinds
          .filter((entry) => entry.use === "method")
          .map((entry) => (
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

function PlantSelect({
  plants,
  value,
  onValue,
}: {
  plants: PlantChoice[] | undefined;
  value: number | null;
  onValue: (value: number | null) => void;
}) {
  if (plants === undefined || plants.length === 0) return null;
  return (
    <Field label="Plant version" htmlFor="study-plant">
      <select
        id="study-plant"
        value={value === null ? "" : String(value)}
        onChange={(event) => {
          onValue(event.target.value === "" ? null : Number(event.target.value));
        }}
        className="w-full rounded-control border border-border bg-surface px-2.5 py-[7px]"
      >
        <option value="">Latest saved version</option>
        {plants.map((plant) => (
          <option key={plant.number} value={plant.number}>
            {`Version ${String(plant.number)}${plant.note === "" ? "" : ` · ${plant.note}`}`}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** The body of the New study dialog: kind, name and the settings its schema asks for. */
export function NewStudyForm({ projectId, kinds, plants, error, pending, onSubmit }: Props) {
  const [kind, setKind] = useState("");
  const [plant, setPlant] = useState<number | null>(null);
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
    const settings = isRecord(value) ? value : {};
    const base = { project: projectId, kind, name: name.trim(), settings };
    onSubmit(plant === null ? base : { ...base, plant_version: plant });
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
      <PlantSelect plants={plants} value={plant} onValue={setPlant} />
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
        <Button type="submit" variant="primary" disabled={!ready || pending}>
          Create study
        </Button>
      </div>
    </form>
  );
}
