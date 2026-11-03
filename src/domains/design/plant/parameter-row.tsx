import { TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toFieldResult, toFieldText, toRangeText } from "./parameter-fields";
import type { FieldEdit, ParameterField } from "./parameter-fields";
import { ParameterRange, type RangeEdit, type Search } from "./parameter-range";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Props = {
  field: ParameterField;
  stored: unknown;
  edit: FieldEdit | undefined;
  isMissing: boolean;
  searchable: boolean;
  search: Search | undefined;
  rangeEdit: RangeEdit | undefined;
  onEdit: (name: string, edit: FieldEdit | null) => void;
  onRange: (name: string, edit: RangeEdit | null) => void;
};

const selectClass = "min-w-0 aria-invalid:border-warn";

type ControlProps = {
  field: ParameterField;
  id: string;
  text: string;
  invalid: boolean;
  describedBy: string | undefined;
  onText: (text: string) => void;
};

function ChoiceControl({ field, id, text, invalid, describedBy, onText }: ControlProps) {
  return (
    <NativeSelect
      id={id}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={`${selectClass} w-full`}
      value={text}
      onChange={(event) => {
        onText(event.target.value);
      }}
    >
      {field.nullable || text === "" ? (
        <NativeSelectOption value="">Not set</NativeSelectOption>
      ) : null}
      {field.options.map((option) => (
        <NativeSelectOption key={option} value={option}>
          {option}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

function ValueControl(props: ControlProps) {
  const { field, id, text, invalid, describedBy, onText } = props;
  if (field.kind === "choice") return <ChoiceControl {...props} />;
  if (field.kind === "flag") {
    return (
      <input
        id={id}
        type="checkbox"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        checked={text === "true"}
        onChange={(event) => {
          onText(String(event.target.checked));
        }}
      />
    );
  }
  const isNumeric = field.kind === "number" || field.kind === "integer";
  return (
    <Input
      id={id}
      className="min-w-0 flex-1"
      type={isNumeric ? "number" : "text"}
      step={isNumeric ? "any" : undefined}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      value={text}
      onChange={(event) => {
        onText(event.target.value);
      }}
    />
  );
}

function UnitControl({
  field,
  unit,
  onUnit,
}: {
  field: ParameterField;
  unit: string | null;
  onUnit: (unit: string) => void;
}) {
  if (field.units.length > 1) {
    return (
      <NativeSelect
        aria-label={`Unit of ${field.label}`}
        className={`${selectClass} max-w-[92px] shrink-0`}
        value={unit ?? ""}
        onChange={(event) => {
          onUnit(event.target.value);
        }}
      >
        {field.units.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {option}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    );
  }
  if (unit === null || unit === "-") return null;
  return <span className="shrink-0 text-[12.5px] text-muted">{unit}</span>;
}

function Notes({ field, searchable }: { field: ParameterField; searchable: boolean }) {
  const range = toRangeText(field);
  if (range === null && field.description === null && !searchable) return null;
  return (
    <p className="text-[11.5px] leading-snug text-muted">
      {range === null ? null : (
        <span className="tabular-nums">
          Range {range}
          {field.unit === null || field.unit === "-" ? "" : ` ${field.unit}`}
          {field.description === null ? "" : ". "}
        </span>
      )}
      {field.description}
      {searchable ? <span className="block">Set a value first to allow a range.</span> : null}
    </p>
  );
}

function Problem({
  id,
  missing,
  problem,
}: {
  id: string;
  missing: boolean;
  problem: string | null;
}) {
  return (
    <p id={id} className="text-[12px]">
      {missing ? (
        <span className="inline-flex items-center gap-1 text-warn">
          <TriangleAlert aria-hidden="true" className="size-3.5" />
          missing
        </span>
      ) : null}
      {problem === null ? null : <span className="text-bad">{problem}</span>}
    </p>
  );
}

/** One module parameter: its value, its unit, the allowed range and gemini's description. */
export function ParameterRow(props: Props) {
  const { field, stored, edit, isMissing, searchable, search, rangeEdit, onEdit, onRange } = props;
  const storedText = toFieldText(field, stored);
  const text = edit?.text ?? storedText;
  const unit = edit?.unit ?? field.unit;
  const problem = edit === undefined ? null : toFieldResult(field, edit).problem;
  const shownMissing = isMissing && text === "";
  const id = `parameter-${field.name}`;
  const invalid = shownMissing || problem !== null;
  const describedBy = invalid ? `${id}-note` : undefined;
  const change = (nextText: string, nextUnit: string | null) => {
    if (nextUnit !== unit && rangeEdit !== undefined) onRange(field.name, null);
    const same = nextText === storedText && nextUnit === field.unit;
    onEdit(field.name, same ? null : { text: nextText, unit: nextUnit });
  };
  return (
    <div className="flex min-w-0 flex-col gap-1" data-missing={shownMissing}>
      <label htmlFor={id} className="text-[12.5px] font-medium">
        {field.label}
      </label>
      <div className="flex min-w-0 items-center gap-1">
        <ValueControl
          field={field}
          id={id}
          text={text}
          invalid={invalid}
          describedBy={describedBy}
          onText={(next) => {
            change(next, unit);
          }}
        />
        <UnitControl
          field={field}
          unit={unit}
          onUnit={(next) => {
            change(text, next);
          }}
        />
      </div>
      {invalid ? <Problem id={`${id}-note`} missing={shownMissing} problem={problem} /> : null}
      <Notes field={field} searchable={searchable && search === undefined} />
      {search === undefined ? null : (
        <ParameterRange
          name={field.name}
          label={field.label}
          search={search}
          unit={unit}
          edit={rangeEdit}
          onEdit={onRange}
        />
      )}
    </div>
  );
}
