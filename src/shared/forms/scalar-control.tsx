import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/shared/ui/input";
import type { JsonSchema } from "./json-schema";

type Props = {
  id: string;
  name: string;
  schema: JsonSchema;
  invalid: boolean;
  describedBy: string | undefined;
  label?: string;
};

const selectClass =
  "w-full rounded-control border border-border bg-surface px-2.5 py-[7px] aria-invalid:border-warn";

function toNumber(text: string): number | undefined {
  if (text.trim() === "") return undefined;
  const number = Number(text);
  return Number.isNaN(number) ? undefined : number;
}

function optionLabel(option: unknown): string {
  return typeof option === "string" || typeof option === "number" ? String(option) : "";
}

function EnumControl({
  common,
  options,
  current,
  update,
}: {
  common: Record<string, unknown>;
  options: unknown[];
  current: unknown;
  update: (next: unknown) => void;
}) {
  return (
    <select
      {...common}
      className={selectClass}
      value={optionLabel(current)}
      onChange={(event) => {
        update(event.target.value === "" ? undefined : event.target.value);
      }}
    >
      <option value="" />
      {options.map((option) => (
        <option key={optionLabel(option)} value={optionLabel(option)}>
          {optionLabel(option)}
        </option>
      ))}
    </select>
  );
}

/** One input for a scalar schema: number, text, checkbox or select; clearing it removes the value. */
export function ScalarControl({ id, name, schema, invalid, describedBy, label }: Props) {
  const { control, setValue } = useFormContext();
  const current: unknown = useWatch({ control, name });
  const update = (next: unknown) => {
    setValue(name, next, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
  };
  const common = {
    id,
    "aria-invalid": invalid,
    "aria-describedby": describedBy,
    ...(label === undefined ? {} : { "aria-label": label }),
  };
  if (schema.enum !== undefined) {
    return <EnumControl common={common} options={schema.enum} current={current} update={update} />;
  }
  if (schema.type === "boolean") {
    return (
      <input
        {...common}
        type="checkbox"
        role="switch"
        className="size-4 accent-[var(--accent)]"
        checked={current === true}
        onChange={(event) => {
          update(event.target.checked);
        }}
      />
    );
  }
  const isNumeric = schema.type === "number" || schema.type === "integer";
  return (
    <Input
      {...common}
      type={isNumeric ? "number" : "text"}
      step={isNumeric ? "any" : undefined}
      min={schema.minimum ?? schema.exclusiveMinimum}
      max={schema.maximum ?? schema.exclusiveMaximum}
      value={typeof current === "string" || typeof current === "number" ? current : ""}
      onChange={(event) => {
        const text = event.target.value;
        update(isNumeric ? toNumber(text) : text === "" ? undefined : text);
      }}
    />
  );
}
