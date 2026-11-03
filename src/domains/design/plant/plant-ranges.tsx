import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/shared/api/errors";
import { LoadError } from "@/shared/forms/load-error";
import { NoteDialog } from "@/shared/forms/note-dialog";
import { labelOf } from "@/shared/forms/json-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { plantSearchQuery, useSavePlantRanges } from "./api";
import { ParameterRange, toRanges, type RangeEdit } from "./parameter-range";
import type { PlantSearch } from "@/shared/api/types";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Notice } from "@/shared/ui/notice";

type Props = { projectId: string; version: number; structureDirty: boolean };
type Entry = PlantSearch["search"][string];

function toLabel(path: string): string {
  return labelOf(path.split(".").at(-1) ?? path, {});
}

function toValueText(entry: Entry): string {
  return typeof entry.value === "number" ? String(entry.value) : "";
}

type UnitProps = {
  label: string;
  entry: Entry;
  unit: string | null;
  onUnit: (unit: string) => void;
};

type RowProps = {
  path: string;
  entry: Entry;
  value: string | undefined;
  unit: string | null;
  edit: RangeEdit | undefined;
  onValue: (name: string, text: string | null) => void;
  onUnit: (name: string, unit: string | null) => void;
  onEdit: (name: string, edit: RangeEdit | null) => void;
};

function UnitChoice({ label, entry, unit, onUnit }: UnitProps) {
  const choices = Object.keys(entry.units);
  if (choices.length > 1) {
    return (
      <NativeSelect
        aria-label={`Unit of ${label}`}
        className="max-w-[92px] min-w-0 shrink-0"
        value={unit ?? ""}
        onChange={(event) => {
          onUnit(event.target.value);
        }}
      >
        {choices.map((choice) => (
          <NativeSelectOption key={choice} value={choice}>
            {choice}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    );
  }
  if (unit === null) return null;
  return <span className="shrink-0 text-[12.5px] text-muted">{unit}</span>;
}

function Row({ path, entry, value, unit, edit, onValue, onUnit, onEdit }: RowProps) {
  const label = toLabel(path);
  const stored = toValueText(entry);
  const id = `plant-${path}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12.5px] font-medium">
        {label}
      </label>
      <div className="flex min-w-0 items-center gap-1">
        <Input
          id={id}
          type="number"
          step="any"
          className="min-w-0 flex-1"
          value={value ?? stored}
          onChange={(event) => {
            const text = event.target.value;
            onValue(path, text === stored ? null : text);
          }}
        />
        <UnitChoice
          label={label}
          entry={entry}
          unit={unit}
          onUnit={(next) => {
            onValue(path, value ?? stored);
            onUnit(path, next === entry.unit ? null : next);
          }}
        />
      </div>
      {entry.value === null ? (
        <p className="text-[11.5px] text-muted">Set a value first to allow a range.</p>
      ) : (
        <ParameterRange
          name={path}
          label={label}
          search={entry}
          unit={unit}
          edit={edit}
          onEdit={onEdit}
        />
      )}
    </div>
  );
}

function withoutKey<Item>(items: Record<string, Item>, name: string) {
  return Object.fromEntries(Object.entries(items).filter(([key]) => key !== name));
}

function toValues(
  texts: Record<string, string>,
  units: Record<string, string>,
  search: PlantSearch["search"],
) {
  return Object.fromEntries(
    Object.entries(texts).flatMap(([path, text]) => {
      const unit = units[path] ?? search[path]?.unit ?? null;
      return text.trim() === "" ? [] : [[path, { value: Number(text), unit }]];
    }),
  );
}

function toMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const detail = error.details.message;
  return typeof detail === "string" ? detail : error.message;
}

function usePlantSave(props: Props, data: PlantSearch["search"]) {
  const save = useSavePlantRanges(props.projectId);
  const [edits, setEdits] = useState<Record<string, RangeEdit>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [isNoting, setIsNoting] = useState(false);
  const onEdit = (name: string, edit: RangeEdit | null) => {
    const others = withoutKey(edits, name);
    setEdits(edit === null ? others : { ...others, [name]: edit });
  };
  const onValue = (name: string, text: string | null) => {
    const others = withoutKey(texts, name);
    setTexts(text === null ? others : { ...others, [name]: text });
  };
  const onUnit = (name: string, unit: string | null) => {
    const others = withoutKey(units, name);
    setUnits(unit === null ? others : { ...others, [name]: unit });
    if (edits[name] !== undefined) onEdit(name, null);
  };
  const submit = (note: string) => {
    const onSuccess = (saved: { number: number }) => {
      setIsNoting(false);
      setEdits({});
      setTexts({});
      setUnits({});
      toast(`Plant v${String(saved.number)} saved`);
    };
    const onError = () => {
      setIsNoting(false);
    };
    const input = { values: toValues(texts, units, data), ranges: toRanges(edits), note };
    save.mutate({ base: props.version, ...input }, { onSuccess, onError });
  };
  const isUnchanged = Object.keys(edits).length === 0 && Object.keys(texts).length === 0;
  const fields = { edits, texts, units, onEdit, onValue, onUnit };
  return { save, isNoting, setIsNoting, isUnchanged, submit, ...fields };
}

function PlantForm({ data, ...props }: Props & { data: PlantSearch["search"] }) {
  const form = usePlantSave(props, data);
  const message = toMessage(form.save.error);
  return (
    <section aria-label="Plant" className="flex min-w-0 flex-col gap-3">
      <h2>Plant</h2>
      {Object.entries(data).map(([path, entry]) => (
        <Row
          key={path}
          path={path}
          entry={entry}
          value={form.texts[path]}
          unit={form.units[path] ?? entry.unit}
          edit={form.edits[path]}
          onValue={form.onValue}
          onUnit={form.onUnit}
          onEdit={form.onEdit}
        />
      ))}
      {message === null ? null : (
        <p role="alert" className="text-bad">
          {message}
        </p>
      )}
      <Button
        variant="default"
        className="self-start"
        disabled={form.isUnchanged || props.structureDirty || form.save.isPending}
        onClick={() => {
          form.setIsNoting(true);
        }}
      >
        Save plant
      </Button>
      <NoteDialog
        open={form.isNoting}
        pending={form.save.isPending}
        onSave={form.submit}
        onClose={() => {
          form.setIsNoting(false);
        }}
      />
    </section>
  );
}

/** The values and search ranges of the plant itself, such as the number of doublets, which no module holds. */
export function PlantRanges(props: Props) {
  const search = useQuery(plantSearchQuery(props.projectId));
  if (search.isPending) return <Notice status="loading" what="the plant" />;
  if (search.isError) {
    return <LoadError error={search.error} what="plant" onRetry={() => void search.refetch()} />;
  }
  if (Object.keys(search.data.search).length === 0) return null;
  return <PlantForm {...props} data={search.data.search} />;
}
