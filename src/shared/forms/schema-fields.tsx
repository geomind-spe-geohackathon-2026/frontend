import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { toChildPath } from "./field-context";
import { FieldFrame } from "./field-frame";
import { isLeaf, isRecord, labelOf, pickVariant, unitsOf, type JsonSchema } from "./json-schema";
import { ScalarControl } from "./scalar-control";

export type NodeProps = { name: string; path: string; label: string; schema: JsonSchema };

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
  const only = units[0];
  if (units.length <= 1)
    return only === undefined ? null : <span className="px-1.5 text-muted">{only}</span>;
  return (
    <select
      aria-label={`Unit of ${label}`}
      aria-invalid={invalid}
      className={selectClass}
      value={typeof unit === "string" ? unit : ""}
      onChange={(event) => {
        setValue(name, event.target.value, { shouldDirty: true, shouldValidate: true });
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
  const { getValues, setValue } = useFormContext();
  const units = unitsOf(schema);
  const valueSchema = schema.properties?.value ?? {};
  const fillUnit = () => {
    const existing: unknown = getValues(`${name}.unit`);
    const first = units[0];
    if (existing === undefined && first !== undefined) setValue(`${name}.unit`, first);
  };
  return (
    <FieldFrame name={name} path={path} label={label}>
      {({ id, invalid, describedBy }) => (
        <div className="flex items-center gap-1">
          <ScalarControl
            id={id}
            name={`${name}.value`}
            schema={valueSchema}
            invalid={invalid}
            describedBy={describedBy}
            onFirstValue={fillUnit}
          />
          <UnitControl name={`${name}.unit`} label={label} units={units} invalid={invalid} />
        </div>
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

function GroupFields({ name, path, label, schema }: NodeProps) {
  const entries = Object.entries(schema.properties ?? {});
  const child = ([key, childSchema]: [string, JsonSchema]) => (
    <FieldNode
      key={key}
      name={`${name}.${key}`}
      path={toChildPath(path, key)}
      label={labelOf(key, childSchema)}
      schema={childSchema}
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
  return (
    <fieldset className="flex flex-col gap-2.5 rounded-card border border-border p-3">
      <legend className="px-1 text-[12.5px] text-muted">{label}</legend>
      {body}
    </fieldset>
  );
}

/** Draws the right control for a schema node: quantity, scalar, series reference, group or list. */
export function FieldNode(props: NodeProps) {
  const { control } = useFormContext();
  const current: unknown = useWatch({ control, name: props.name });
  const schema = pickVariant(props.schema, current);
  const shown = { ...props, schema };
  if (isLeaf(schema)) return <QuantityField {...shown} />;
  if (schema.properties?.file !== undefined) return <SeriesReference {...shown} />;
  if (schema.properties !== undefined) return <GroupFields {...shown} />;
  if (schema.type === "array" && isRecord(schema.items) && schema.items.properties !== undefined) {
    return <ListField {...shown} />;
  }
  if (
    schema.enum !== undefined ||
    ["number", "integer", "string", "boolean"].includes(schema.type ?? "")
  ) {
    return <ScalarField {...shown} />;
  }
  return null;
}
