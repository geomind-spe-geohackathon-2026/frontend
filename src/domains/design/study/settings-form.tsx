import { useState } from "react";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { toSettings, type RawSettings } from "./settings";
import type { SchemaProperty, SettingsSchema } from "@/shared/api/design";

type Props = {
  schema: SettingsSchema;
  onChange: (settings: Record<string, unknown>, raw: RawSettings) => void;
};

type ControlProps = {
  id: string;
  property: SchemaProperty;
  value: string;
  onValue: (value: string) => void;
};

function Control({ id, property, value, onValue }: ControlProps) {
  const options = property.type === "boolean" ? ["true", "false"] : (property.enum ?? []);
  if (options.length > 0) {
    return (
      <select
        id={id}
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        className="w-full rounded-control border border-border bg-surface px-2.5 py-[7px]"
      >
        <option value="">not set</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  const numeric = property.type === "number" || property.type === "integer";
  return (
    <Input
      id={id}
      type={numeric ? "number" : "text"}
      step={property.type === "integer" ? 1 : "any"}
      value={value}
      onChange={(event) => {
        onValue(event.target.value);
      }}
    />
  );
}

/** A small settings form generated from a JSON schema; fields start empty and unit labels come from the schema. */
export function SettingsForm({ schema, onChange }: Props) {
  const [raw, setRaw] = useState<RawSettings>({});
  const entries = Object.entries(schema.properties ?? {});
  if (entries.length === 0) return <p className="text-muted">This kind has no settings.</p>;

  function handleValue(name: string, value: string): void {
    const next = { ...raw, [name]: value };
    setRaw(next);
    onChange(toSettings(schema, next), next);
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([name, property]) => {
        const required = schema.required?.includes(name) === true;
        const unit =
          property.unit === undefined || property.unit === "" ? "" : ` (${property.unit})`;
        return (
          <Field
            key={name}
            label={`${property.title ?? name}${unit}${required ? " *" : ""}`}
            htmlFor={`setting-${name}`}
          >
            <Control
              id={`setting-${name}`}
              property={property}
              value={raw[name] ?? ""}
              onValue={(value) => {
                handleValue(name, value);
              }}
            />
          </Field>
        );
      })}
    </div>
  );
}
