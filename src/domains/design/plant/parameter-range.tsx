import { Input } from "@/shared/ui/input";
import type { Parameters } from "@/shared/api/types";

export type RangeEdit = { min: string; max: string; unit: string | null };
export type Search = Parameters["search"][string];
type Side = "min" | "max";

type Props = {
  name: string;
  label: string;
  search: Search;
  unit: string | null;
  edit: RangeEdit | undefined;
  onEdit: (name: string, edit: RangeEdit | null) => void;
};

function toText(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function toStored(search: Search, unit: string | null): RangeEdit {
  const ends = unit === null ? undefined : search.units[unit];
  return { min: toText((ends ?? search).min), max: toText((ends ?? search).max), unit };
}

/** The ends of a search range in the unit of the value: a study may move the value between them; both empty keeps it fixed. */
export function ParameterRange({ name, label, search, unit, edit, onEdit }: Props) {
  const stored = toStored(search, unit);
  const shown = edit ?? stored;
  const change = (side: Side, text: string) => {
    const next = { ...shown, [side]: text };
    const same = next.min === stored.min && next.max === stored.max;
    onEdit(name, same ? null : next);
  };
  const end = (side: Side, title: string) => (
    <label className="flex min-w-0 flex-1 flex-col gap-0.5 text-[11.5px] text-muted">
      {title}
      <Input
        type="number"
        step="any"
        aria-label={`${title} of the search range of ${label}`}
        value={shown[side]}
        onChange={(event) => {
          change(side, event.target.value);
        }}
      />
    </label>
  );
  const shownUnit = unit === null || unit === "-" ? "" : ` (${unit})`;
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-1 border-0 p-0">
      <legend className="p-0 text-[11.5px] text-muted">
        Search range{shownUnit}. Leave both empty to keep the value fixed.
      </legend>
      <div className="flex min-w-0 gap-1.5">
        {end("min", "Min")}
        {end("max", "Max")}
      </div>
    </fieldset>
  );
}

/** Turns the edited ends of search ranges into what the plant saves; both empty removes a range. */
export function toRanges(edits: Record<string, RangeEdit>) {
  const toEnd = (text: string) => (text.trim() === "" ? null : Number(text));
  return Object.fromEntries(
    Object.entries(edits).map(([name, edit]) => [
      name,
      { min: toEnd(edit.min), max: toEnd(edit.max), unit: edit.unit },
    ]),
  );
}
