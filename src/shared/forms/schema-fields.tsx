import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { toChildPath, toFullPath, useFieldContext } from "./field-context";
import { FieldFrame, isReported } from "./field-frame";
import {
  isLeaf,
  isRecord,
  labelOf,
  pickVariant,
  unitsOf,
  variantsOf,
  type JsonSchema,
} from "./json-schema";
import { ScalarControl } from "./scalar-control";

export type NodeProps = {
  name: string;
  path: string;
  label: string;
  schema: JsonSchema;
  optional?: boolean;
};

const selectClass =
  "rounded-control border border-border bg-surface px-2 py-[7px] aria-invalid:border-warn";

function SeriesReference({ name, path, label }: NodeProps) {
  const { control } = useFormContext();
  const reference: unknown = useWatch({ control, name });
  const file = isRecord(reference) ? reference : {};
  return (
    <FieldFrame name={name} path={path} label={label}>
      {({ id }) => (
        <p id={id} className="rounded-control bg-sunken px-2.5 py-[7px]">
          {String(file.file)} / {String(file.column)} {String(file.unit)}
        </p>
      )}
    </FieldFrame>
  );
}

function UnitControl({
  name,
  label,
  units,
  invalid,
}: {
  name: string;
  label: string;
  units: string[];
  invalid: boolean;
}) {
  const { control, setValue } = useFormContext();
  const unit: unknown = useWatch({ control, name });
  if (units.length === 0) return null;
  return (
    <select
      aria-label={`Unit of ${label}`}
      aria-invalid={invalid}
      className={selectClass}
      value={typeof unit === "string" ? unit : ""}
      onChange={(event) => {
        setValue(name, event.target.value === "" ? undefined : event.target.value, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }}
    >
      {typeof unit === "string" && units.includes(unit) ? null : <option value="" />}
      {units.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function QuantityField({ name, path, label, schema }: NodeProps) {
  const { control } = useFormContext();
  const quantity: unknown = useWatch({ control, name });
  const units = unitsOf(schema);
  const valueSchema = schema.properties?.value ?? {};
  const lacksUnit =
    isRecord(quantity) && quantity.value !== undefined && quantity.unit === undefined;
  return (
    <FieldFrame name={name} path={path} label={label}>
      {({ id, invalid, describedBy }) => (
        <>
          <div className="flex items-center gap-1">
            <ScalarControl
              id={id}
              name={`${name}.value`}
              schema={valueSchema}
              invalid={invalid}
              describedBy={describedBy}
            />
            <UnitControl
              name={`${name}.unit`}
              label={label}
              units={units}
              invalid={invalid || lacksUnit}
            />
          </div>
          {lacksUnit ? (
            <span className="inline-flex items-center gap-1 text-[12px] text-warn">
              <TriangleAlert aria-hidden="true" className="size-3.5" />
              unit missing
            </span>
          ) : null}
        </>
      )}
    </FieldFrame>
  );
}

function ScalarField({ name, path, label, schema }: NodeProps) {
  return (
    <FieldFrame name={name} path={path} label={label} unit={schema.unit}>
      {({ id, invalid, describedBy }) => (
        <ScalarControl
          id={id}
          name={name}
          schema={schema}
          invalid={invalid}
          describedBy={describedBy}
        />
      )}
    </FieldFrame>
  );
}

function ListField({ name, path, label, schema }: NodeProps) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const item = schema.items ?? {};
  return (
    <fieldset className="flex flex-col gap-2 rounded-card border border-border p-3">
      <legend className="px-1 text-[12.5px] text-muted">{label}</legend>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2 rounded-control bg-sunken p-2">
          <div className="min-w-0 flex-1">
            <FieldNode
              name={`${name}.${String(index)}`}
              path={toChildPath(path, String(index))}
              label={`${label} ${String(index + 1)}`}
              schema={item}
            />
          </div>
          <Button
            aria-label={`Remove ${label} ${String(index + 1)}`}
            onClick={() => {
              remove(index);
            }}
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        className="self-start"
        onClick={() => {
          append({});
        }}
      >
        <Plus aria-hidden="true" className="size-3.5" />
        Add {label.toLowerCase()}
      </Button>
    </fieldset>
  );
}

function ChoiceListField({ name, path, label, schema }: NodeProps) {
  const { control, setValue } = useFormContext();
  const current: unknown = useWatch({ control, name });
  const chosen: unknown[] = Array.isArray(current) ? current : [];
  const options = schema.items?.enum ?? [];
  const toggle = (option: unknown, checked: boolean) => {
    const next = checked ? [...chosen, option] : chosen.filter((item) => item !== option);
    setValue(name, next.length === 0 ? undefined : next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  return (
    <FieldFrame name={name} path={path} label={label}>
      {({ id }) => (
        <div id={id} role="group" aria-label={label} className="flex flex-wrap gap-x-3 gap-y-1">
          {options.map((option) => {
            const text = String(option);
            return (
              <label key={text} className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={chosen.includes(option)}
                  onChange={(event) => {
                    toggle(option, event.target.checked);
                  }}
                />
                {text}
              </label>
            );
          })}
        </div>
      )}
    </FieldFrame>
  );
}

function hasContent(value: unknown): boolean {
  return isRecord(value) ? Object.keys(value).length > 0 : value !== undefined;
}

function OptionalGroup({ name, path, label, children }: NodeProps & { children: ReactNode }) {
  const { control } = useFormContext();
  const { prefix, missing, problems } = useFieldContext();
  const value: unknown = useWatch({ control, name });
  const full = toFullPath(prefix, path);
  const needsAttention =
    isReported(missing, full) || problems.some((problem) => problem.path.startsWith(full));
  return (
    <details
      open={hasContent(value) || needsAttention}
      className="rounded-card border border-border p-3"
    >
      <summary className="cursor-pointer text-[12.5px] text-muted">{label}</summary>
      <div className="mt-2.5 flex flex-col gap-2.5">{children}</div>
    </details>
  );
}

function GroupFields(props: NodeProps) {
  const { name, path, label, schema, optional = false } = props;
  const entries = Object.entries(schema.properties ?? {});
  const required = new Set(schema.required ?? []);
  const child = ([key, childSchema]: [string, JsonSchema]) => (
    <FieldNode
      key={key}
      name={`${name}.${key}`}
      path={toChildPath(path, key)}
      label={labelOf(key, childSchema)}
      schema={childSchema}
      optional={!required.has(key)}
    />
  );
  const isInline = (childSchema: JsonSchema) =>
    childSchema.properties === undefined || isLeaf(childSchema);
  const inline = entries.filter(([, childSchema]) => isInline(pickVariant(childSchema, undefined)));
  const nested = entries.filter(
    ([, childSchema]) => !isInline(pickVariant(childSchema, undefined)),
  );
  const body = (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-x-3 gap-y-2.5">
        {inline.map(child)}
      </div>
      {nested.map(child)}
    </>
  );
  if (path === "") return <div className="flex flex-col gap-3">{body}</div>;
  if (optional) return <OptionalGroup {...props}>{body}</OptionalGroup>;
  return (
    <fieldset className="flex flex-col gap-2.5 rounded-card border border-border p-3">
      <legend className="px-1 text-[12.5px] text-muted">{label}</legend>
      {body}
    </fieldset>
  );
}

function toVariantLabel(variant: JsonSchema): string {
  if (variant.title !== undefined) return variant.title;
  if (isLeaf(variant)) return "Value";
  if (variant.properties?.file !== undefined) return "Series from a file";
  if (variant.type === "string") return "Text";
  return "Details";
}

function VariantField(props: NodeProps) {
  const { control, setValue } = useFormContext();
  const current: unknown = useWatch({ control, name: props.name });
  const [chosen, setChosen] = useState<number | null>(null);
  const variants = variantsOf(props.schema);
  const fitting = variants.indexOf(pickVariant(props.schema, current));
  const active = chosen ?? Math.max(0, fitting);
  const variant = variants[active] ?? {};
  return (
    <div className="flex flex-col gap-2">
      <select
        aria-label={`Form of ${props.label === "" ? "the value" : props.label}`}
        className={selectClass}
        value={active}
        onChange={(event) => {
          setChosen(Number(event.target.value));
          setValue(props.name, undefined, { shouldDirty: true, shouldValidate: true });
        }}
      >
        {variants.map((option, index) => (
          <option key={toVariantLabel(option)} value={index}>
            {toVariantLabel(option)}
          </option>
        ))}
      </select>
      <FieldNode {...props} schema={variant} />
    </div>
  );
}

/** Draws the right control for a schema node: quantity, scalar, series reference, group or list. */
export function FieldNode(props: NodeProps) {
  if (variantsOf(props.schema).length > 1) return <VariantField {...props} />;
  const shown = { ...props, schema: pickVariant(props.schema, undefined) };
  const { schema } = shown;
  if (isLeaf(schema)) return <QuantityField {...shown} />;
  if (schema.properties?.file !== undefined) return <SeriesReference {...shown} />;
  if (schema.properties !== undefined) return <GroupFields {...shown} />;
  if (schema.type === "array" && isRecord(schema.items) && schema.items.properties !== undefined) {
    return <ListField {...shown} />;
  }
  if (schema.type === "array" && schema.items?.enum !== undefined) {
    return <ChoiceListField {...shown} />;
  }
  if (
    schema.enum !== undefined ||
    ["number", "integer", "string", "boolean"].includes(schema.type ?? "")
  ) {
    return <ScalarField {...shown} />;
  }
  return null;
}
