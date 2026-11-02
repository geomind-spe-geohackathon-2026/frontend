import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { toChildPath, toFullPath, useFieldContext } from "./field-context";
import { FieldFrame, isReported } from "./field-frame";
import {
  boundsOf,
  formEntries,
  isLeaf,
  isRecord,
  labelOf,
  offersChoice,
  pickVariant,
  unitsOf,
  variantsOf,
  type JsonSchema,
} from "./json-schema";
import { ScalarControl } from "./scalar-control";
import { SeriesPicker } from "./series-picker";

export type NodeProps = {
  name: string;
  path: string;
  label: string;
  schema: JsonSchema;
  optional?: boolean;
};

function toPatternHint(schema: JsonSchema): string | undefined {
  return schema.pattern === undefined ? undefined : "lower case letters, digits and _";
}

function toSingular(label: string): string {
  return label.endsWith("s") ? label.slice(0, -1) : label;
}

const selectClass =
  "rounded-control border border-border bg-surface px-2 py-[7px] aria-invalid:border-warn";

function SeriesReference({ name, path, label, schema }: NodeProps) {
  return (
    <FieldFrame name={name} path={path} label={label} wide>
      {({ id }) => <SeriesPicker id={id} name={name} label={label} units={unitsOf(schema)} />}
    </FieldFrame>
  );
}

function UnitControl({
  name,
  label,
  units,
  invalid,
  disabled,
}: {
  name: string;
  label: string;
  units: string[];
  invalid: boolean;
  disabled: boolean;
}) {
  const { control, setValue } = useFormContext();
  const unit: unknown = useWatch({ control, name });
  if (units.length === 0) return null;
  return (
    <select
      aria-label={`Unit of ${label}`}
      aria-invalid={invalid}
      disabled={disabled}
      className={selectClass}
      value={typeof unit === "string" ? unit : ""}
      onChange={(event) => {
        setValue(name, event.target.value === "" ? undefined : event.target.value, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }}
    >
      {typeof unit === "string" && units.includes(unit) ? null : <option value="">unit</option>}
      {units.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function QuantityField({ name, path, label, schema, optional = false }: NodeProps) {
  const { control } = useFormContext();
  const { hints, prefix } = useFieldContext();
  const quantity: unknown = useWatch({ control, name });
  const units = unitsOf(schema);
  const valueSchema = schema.properties?.value ?? {};
  const lacksUnit =
    isRecord(quantity) && quantity.value !== undefined && quantity.unit === undefined;
  return (
    <FieldFrame
      name={name}
      path={path}
      label={label}
      hint={hints?.[toFullPath(prefix, path)] ?? boundsOf(valueSchema)}
      description={schema.description}
      required={!optional}
    >
      {({ id, invalid, describedBy }) => (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
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
              disabled={!invalid && (!isRecord(quantity) || quantity.value === undefined)}
            />
          </div>
          {lacksUnit ? (
            <span className="inline-flex items-center gap-1 text-[12px] text-warn">
              <TriangleAlert aria-hidden="true" className="size-3.5" />
              choose a unit
            </span>
          ) : null}
          <ValueExtras name={name} label={label} schema={schema} />
        </>
      )}
    </FieldFrame>
  );
}

function useExtra(name: string): Record<string, unknown> {
  const { control } = useFormContext();
  const value: unknown = useWatch({ control, name });
  return isRecord(value) ? value : {};
}

function ExtraNumber({ name, label, title }: { name: string; label: string; title: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      {title}
      <ScalarControl
        id={name}
        name={name}
        schema={{ type: "number" }}
        invalid={false}
        describedBy={undefined}
        label={label}
      />
    </span>
  );
}

function toRangeBadge(range: Record<string, unknown>): string | null {
  const { min, max } = range;
  if (typeof min === "number" && typeof max === "number") {
    return `${String(min)} to ${String(max)}`;
  }
  if (typeof min === "number") return `from ${String(min)}`;
  return typeof max === "number" ? `to ${String(max)}` : null;
}

function toUncertaintyBadge(uncertainty: Record<string, unknown>): string | null {
  const { kind, std } = uncertainty;
  if (typeof kind !== "string") return null;
  if (typeof std === "number") return `${kind} σ ${String(std)}`;
  const spread = toRangeBadge(uncertainty);
  return spread === null ? kind : `${kind} ${spread}`;
}

function Toggle({
  title,
  hint,
  badge,
  children,
}: {
  title: string;
  hint: string;
  badge: string | null;
  children: ReactNode;
}) {
  return (
    <details className="min-w-0 text-[12px] text-muted">
      <summary className="cursor-pointer" title={hint}>
        {title}
        {badge === null ? null : (
          <span className="ml-1 rounded-pill border border-border px-1.5 tabular-nums">
            {badge}
          </span>
        )}
      </summary>
      <div className="mt-1 flex flex-col gap-1">{children}</div>
    </details>
  );
}

const rangeHint =
  "Kept with the value. No study reads a range on the case: Optimise searches the ranges on the plant.";
const uncertaintyHint =
  "Uncertainty and Sensitivity move this value: draws from this distribution, or its low and high end.";
const kinds: Record<string, string[]> = {
  uniform: ["min", "max"],
  triangular: ["min", "max"],
  normal: ["std"],
};

function RangeToggle({ name, label }: { name: string; label: string }) {
  const range = useExtra(`${name}.range`);
  return (
    <Toggle title="Range" hint={rangeHint} badge={toRangeBadge(range)}>
      <div className="grid grid-cols-2 gap-1">
        {["min", "max"].map((side) => (
          <ExtraNumber
            key={side}
            name={`${name}.range.${side}`}
            title={labelOf(side, {})}
            label={`${labelOf(side, {})} of the range of ${label}`}
          />
        ))}
      </div>
    </Toggle>
  );
}

function UncertaintyToggle({
  name,
  label,
  schema,
}: {
  name: string;
  label: string;
  schema: JsonSchema;
}) {
  const uncertainty = useExtra(`${name}.uncertainty`);
  const kind = typeof uncertainty.kind === "string" ? uncertainty.kind : "";
  return (
    <Toggle title="Uncertainty" hint={uncertaintyHint} badge={toUncertaintyBadge(uncertainty)}>
      <span className="flex flex-col gap-0.5">
        Distribution
        <ScalarControl
          id={`${name}.uncertainty.kind`}
          name={`${name}.uncertainty.kind`}
          schema={schema.properties?.kind ?? {}}
          invalid={false}
          describedBy={undefined}
          label={`Distribution of ${label}`}
          words
        />
      </span>
      <div className="grid grid-cols-2 gap-1">
        {(kinds[kind] ?? []).map((key) => (
          <ExtraNumber
            key={key}
            name={`${name}.uncertainty.${key}`}
            title={labelOf(key, {})}
            label={`${labelOf(key, {})} of ${label}`}
          />
        ))}
      </div>
    </Toggle>
  );
}

function ValueExtras({ name, label, schema }: { name: string; label: string; schema: JsonSchema }) {
  const { hideRange } = useFieldContext();
  const { range: rangeSchema, uncertainty } = schema.properties ?? {};
  const range = hideRange === true ? undefined : rangeSchema;
  if (range === undefined && uncertainty === undefined) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {range === undefined ? null : <RangeToggle name={name} label={label} />}
      {uncertainty === undefined ? null : (
        <UncertaintyToggle name={name} label={label} schema={uncertainty} />
      )}
    </div>
  );
}

function ScalarField({ name, path, label, schema, optional = false }: NodeProps) {
  return (
    <FieldFrame
      name={name}
      path={path}
      label={label}
      unit={schema.unit}
      hint={boundsOf(schema) ?? toPatternHint(schema)}
      description={schema.description}
      required={!optional}
    >
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

function ListItem({ name, path, label, schema, onRemove }: NodeProps & { onRemove: () => void }) {
  const { control } = useFormContext();
  const { describeItem } = useFieldContext();
  const value: unknown = useWatch({ control, name });
  const title = isRecord(value) && typeof value.name === "string" ? value.name : label;
  const sentence = describeItem?.(value) ?? null;
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-mono text-[13px] font-medium">{title}</h3>
          {sentence === null ? null : <p className="text-[12.5px] text-muted">{sentence}</p>}
        </div>
        <Button aria-label={`Remove ${label}`} onClick={onRemove}>
          <Trash2 aria-hidden="true" className="size-3.5" />
        </Button>
      </div>
      <div className="[&>fieldset]:border-0 [&>fieldset]:p-0 [&>fieldset>legend]:sr-only">
        <FieldNode name={name} path={path} label={label} schema={schema} />
      </div>
    </div>
  );
}

function ListField({ name, path, label, schema }: NodeProps) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const item = schema.items ?? {};
  return (
    <div className="flex flex-col gap-2">
      {path.includes(".") ? <h3 className="text-[13px] font-medium">{label}</h3> : null}
      {fields.map((field, index) => (
        <ListItem
          key={field.id}
          name={`${name}.${String(index)}`}
          path={toChildPath(path, String(index))}
          label={`${label} ${String(index + 1)}`}
          schema={item}
          onRemove={() => {
            remove(index);
          }}
        />
      ))}
      <Button
        className="self-start"
        onClick={() => {
          append({});
        }}
      >
        <Plus aria-hidden="true" className="size-3.5" />
        Add {toSingular(label).toLowerCase()}
      </Button>
    </div>
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
      open={hasContent(value) || needsAttention || !path.includes(".")}
      className="rounded-card border border-border p-3"
    >
      <summary className="cursor-pointer text-[12.5px] text-muted">{label}</summary>
      <div className="mt-2.5 flex flex-col gap-2.5">{children}</div>
    </details>
  );
}

function GroupFields(props: NodeProps) {
  const { name, path, label, schema, optional = false } = props;
  const entries = formEntries(schema);
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
  const someRequired = inline.some(([key]) => required.has(key));
  const basic = inline.filter(([key]) => !someRequired || required.has(key));
  const advanced = inline.filter(([key]) => someRequired && !required.has(key));
  const body = (
    <>
      {schema.description === undefined ? null : (
        <p className="text-[12.5px] text-muted">{schema.description}</p>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-x-3 gap-y-2.5">
        {basic.map(child)}
      </div>
      {advanced.length === 0 ? null : (
        <details className="rounded-control border border-border p-2">
          <summary className="cursor-pointer text-[12.5px] text-muted">Advanced</summary>
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-x-3 gap-y-2.5">
            {advanced.map(child)}
          </div>
        </details>
      )}
      {nested.map(child)}
    </>
  );
  if (path === "") return <div className="flex flex-col gap-3">{body}</div>;
  if (optional) return <OptionalGroup {...props}>{body}</OptionalGroup>;
  return (
    <fieldset className="flex flex-col gap-2.5 rounded-card border border-border p-3">
      <legend className="px-1 text-[13px] font-medium text-text">{label}</legend>
      {body}
    </fieldset>
  );
}

function toVariantLabel(variant: JsonSchema): string {
  if (variant.title !== undefined) return variant.title;
  if (isLeaf(variant)) return "Constant";
  if (variant.properties?.file !== undefined) return "Series from a file";
  if (variant.type === "string") return "Name of a file";
  return "Fill in here";
}

function VariantField(props: NodeProps) {
  const { control, setValue } = useFormContext();
  const current: unknown = useWatch({ control, name: props.name });
  const [chosen, setChosen] = useState<number | null>(null);
  const variants = variantsOf(props.schema);
  const fitting = variants.indexOf(pickVariant(props.schema, current));
  const active = chosen ?? Math.max(0, fitting);
  const variant = variants[active] ?? {};
  if (chosen === null && !offersChoice(props.schema, current)) {
    return <FieldNode {...props} schema={variant} />;
  }
  return (
    <div className="col-span-full flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label={`Form of ${props.label === "" ? "the value" : props.label}`}
        className="inline-flex self-start rounded-control border border-border p-0.5"
      >
        {variants.map((option, index) => (
          <button
            key={toVariantLabel(option)}
            type="button"
            role="radio"
            aria-checked={index === active}
            className={`rounded-control px-2.5 py-1 text-[12.5px] ${index === active ? "bg-accent-soft font-medium text-accent" : "text-muted"}`}
            onClick={() => {
              setChosen(index);
              setValue(props.name, undefined, { shouldDirty: true, shouldValidate: true });
            }}
          >
            {toVariantLabel(option)}
          </button>
        ))}
      </div>
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
