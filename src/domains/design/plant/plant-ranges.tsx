import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/shared/api/errors";
import { LoadError } from "@/shared/forms/load-error";
import { NoteDialog } from "@/shared/forms/note-dialog";
import { labelOf } from "@/shared/forms/json-schema";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";
import { plantSearchQuery, useSavePlantRanges } from "./api";
import { ParameterRange, toRanges, type RangeEdit } from "./parameter-range";
import type { PlantSearch } from "@/shared/api/types";

type Props = { projectId: string; version: number; structureDirty: boolean };
type Entry = PlantSearch["search"][string];

function toLabel(path: string): string {
  return labelOf(path.split(".").at(-1) ?? path, {});
}

function toValueText(entry: Entry): string {
  const value = typeof entry.value === "number" ? String(entry.value) : "";
  return entry.unit === null ? value : `${value} ${entry.unit}`;
}

function Row({
  path,
  entry,
  edit,
  onEdit,
}: {
  path: string;
  entry: Entry;
  edit: RangeEdit | undefined;
  onEdit: (name: string, edit: RangeEdit | null) => void;
}) {
  const label = toLabel(path);
  if (entry.value === null) {
    return (
      <div className="flex flex-col gap-0.5">
        <p className="text-[12.5px] font-medium">{label}</p>
        <p className="text-[11.5px] text-muted">Set a value first to allow a range.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12.5px] font-medium">
        {label} <span className="font-normal text-muted">{toValueText(entry)}</span>
      </p>
      <ParameterRange
        name={path}
        label={label}
        search={entry}
        unit={entry.unit}
        edit={edit}
        onEdit={onEdit}
      />
    </div>
  );
}

function toMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const detail = error.details.message;
  return typeof detail === "string" ? detail : error.message;
}

/** The search ranges of the plant itself, such as the number of doublets, which no module holds. */
export function PlantRanges({ projectId, version, structureDirty }: Props) {
  const search = useQuery(plantSearchQuery(projectId));
  const save = useSavePlantRanges(projectId);
  const [edits, setEdits] = useState<Record<string, RangeEdit>>({});
  const [isNoting, setIsNoting] = useState(false);
  if (search.isPending) return <p className="text-muted">Loading the plant…</p>;
  if (search.isError) {
    return <LoadError error={search.error} what="plant" onRetry={() => void search.refetch()} />;
  }
  const entries = Object.entries(search.data.search);
  if (entries.length === 0) return null;
  const handleEdit = (name: string, edit: RangeEdit | null) => {
    const others = Object.fromEntries(Object.entries(edits).filter(([key]) => key !== name));
    setEdits(edit === null ? others : { ...others, [name]: edit });
  };
  const submit = (note: string) => {
    const onSuccess = (saved: { number: number }) => {
      setIsNoting(false);
      setEdits({});
      showToast(`Plant v${String(saved.number)} saved`);
    };
    const onError = () => {
      setIsNoting(false);
    };
    save.mutate({ base: version, ranges: toRanges(edits), note }, { onSuccess, onError });
  };
  const message = toMessage(save.error);
  return (
    <section aria-label="Plant" className="flex min-w-0 flex-col gap-3">
      <h2>Plant</h2>
      {entries.map(([path, entry]) => (
        <Row key={path} path={path} entry={entry} edit={edits[path]} onEdit={handleEdit} />
      ))}
      {message === null ? null : (
        <p role="alert" className="text-bad">
          {message}
        </p>
      )}
      <Button
        variant="primary"
        className="self-start"
        disabled={Object.keys(edits).length === 0 || structureDirty || save.isPending}
        onClick={() => {
          setIsNoting(true);
        }}
      >
        Save ranges
      </Button>
      <NoteDialog
        open={isNoting}
        pending={save.isPending}
        onSave={submit}
        onClose={() => {
          setIsNoting(false);
        }}
      />
    </section>
  );
}
