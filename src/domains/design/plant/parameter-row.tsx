import { TriangleAlert } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { toFieldResult, toFieldText, toRangeText } from "./parameter-fields";
import type { FieldEdit, ParameterField } from "./parameter-fields";

type Props = {
  field: ParameterField;
  stored: unknown;
  edit: FieldEdit | undefined;
  isMissing: boolean;
  onEdit: (name: string, edit: FieldEdit | null) => void;
};

const selectClass =
  "min-w-0 rounded-control border border-border bg-surface px-1.5 py-[7px] aria-invalid:border-warn";

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
    <select
      id={id}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={`${selectClass} w-full`}
      value={text}
      onChange={(event) => {
        onText(event.target.value);
      }}
    >
      {field.nullable || text === "" ? <option value="">Not set</option> : null}
      {field.options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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
      <select
        aria-label={`Unit of ${field.label}`}
        className={`${selectClass} max-w-[92px] shrink-0`}
        value={unit ?? ""}
        onChange={(event) => {
          onUnit(event.target.value);
        }}
      >
        {field.units.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (unit === null || unit === "-") return null;
  return <span className="shrink-0 text-[12.5px] text-muted">{unit}</span>;
}

function Notes({ field }: { field: ParameterField }) {
  const range = toRangeText(field);
  if (range === null && field.description === null) return null;
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
    </p>
  );
}

/** One module parameter: its value, its unit, the allowed range and gemini's description. */
export function ParameterRow({ field, stored, edit, isMissing, onEdit }: Props) {
  const storedText = toFieldText(field, stored);
  const text = edit?.text ?? storedText;
  const unit = edit?.unit ?? field.unit;
  const problem = edit === undefined ? null : toFieldResult(field, edit).problem;
  const shownMissing = isMissing && text === "";
  const id = `parameter-${field.name}`;
  const invalid = shownMissing || problem !== null;
  const describedBy = invalid ? `${id}-note` : undefined;
  const change = (nextText: string, nextUnit: string | null) => {
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
      {invalid ? (
        <p id={`${id}-note`} className="text-[12px]">
          {shownMissing ? (
            <span className="inline-flex items-center gap-1 text-warn">
              <TriangleAlert aria-hidden="true" className="size-3.5" />
              missing
            </span>
          ) : null}
          {problem === null ? null : <span className="text-bad">{problem}</span>}
        </p>
      ) : null}
      <Notes field={field} />
    </div>
  );
}
