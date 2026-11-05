import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { JsonSchema } from "./json-schema";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Props = {
  id: string;
  name: string;
  schema: JsonSchema;
  invalid: boolean;
  describedBy: string | undefined;
  label?: string;
  words?: boolean;
  scale?: number | undefined;
};

const scaledDigits = 15;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const selectClass = "aria-invalid:border-warn";

function toNumber(text: string): number | undefined {
  if (text.trim() === "") return undefined;
  const number = Number(text);
  return Number.isNaN(number) ? undefined : number;
}

function isDateValue(schema: JsonSchema, current: unknown): boolean {
  if (schema["x-date"] !== true) return false;
  return current === undefined || (typeof current === "string" && datePattern.test(current));
}

function optionLabel(option: unknown): string {
  return typeof option === "string" || typeof option === "number" ? String(option) : "";
}

const singleDigits = 7;

function toClean(value: number): string {
  const text = String(value);
  if (text.length <= 12) return text;
  const rounded = Number(value.toPrecision(singleDigits));
  return Math.abs(rounded - value) <= Math.abs(value) * 1e-7 ? String(rounded) : text;
}

function toShown(current: unknown, scale: number): string {
  if (typeof current !== "number") return "";
  if (scale === 1) return toClean(current);
  return String(Number((current * scale).toPrecision(scaledDigits)));
}

function NumberControl({
  common,
  schema,
  current,
  scale,
  update,
}: {
  common: Record<string, unknown>;
  schema: JsonSchema;
  current: unknown;
  scale: number;
  update: (next: unknown) => void;
}) {
  const [typed, setTyped] = useState<string | null>(null);
  return (
    <Input
      {...common}
      type="number"
      step="any"
      min={schema.minimum ?? schema.exclusiveMinimum}
      max={schema.maximum ?? schema.exclusiveMaximum}
      value={typed ?? toShown(current, scale)}
      onChange={(event) => {
        const text = event.target.value;
        setTyped(text);
        const number = toNumber(text);
        update(number === undefined ? undefined : number / scale);
      }}
      onBlur={() => {
        setTyped(null);
      }}
    />
  );
}

function SwitchControl({
  common,
  current,
  update,
}: {
  common: Record<string, unknown>;
  current: unknown;
  update: (next: unknown) => void;
}) {
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

function toWord(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).replaceAll("_", " ");
}

function EnumControl({
  common,
  options,
  current,
  update,
  words,
}: {
  common: Record<string, unknown>;
  options: unknown[];
  current: unknown;
  update: (next: unknown) => void;
  words: boolean;
}) {
  return (
    <NativeSelect
      {...common}
      className={selectClass}
      value={optionLabel(current)}
      onChange={(event) => {
        update(event.target.value === "" ? undefined : event.target.value);
      }}
    >
      <NativeSelectOption value="" />
      {options.map((option) => (
        <NativeSelectOption key={optionLabel(option)} value={optionLabel(option)}>
          {words ? toWord(optionLabel(option)) : optionLabel(option)}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

/** One input for a scalar schema: number, text, checkbox or select; clearing it removes the value. */
export function ScalarControl({
  id,
  name,
  schema,
  invalid,
  describedBy,
  label,
  words,
  scale,
}: Props) {
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
    return (
      <EnumControl
        common={common}
        options={schema.enum}
        current={current}
        update={update}
        words={words === true}
      />
    );
  }
  if (schema.type === "boolean") {
    return <SwitchControl common={common} current={current} update={update} />;
  }
  const isNumeric = schema.type === "number" || schema.type === "integer";
  if (isNumeric) {
    return (
      <NumberControl
        common={common}
        schema={schema}
        current={current}
        scale={scale ?? 1}
        update={update}
      />
    );
  }
  return (
    <Input
      {...common}
      type={isDateValue(schema, current) ? "date" : "text"}
      value={typeof current === "string" || typeof current === "number" ? current : ""}
      onChange={(event) => {
        const text = event.target.value;
        update(text === "" ? undefined : text);
      }}
    />
  );
}
