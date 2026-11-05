import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toChildPath, toFullPath, useFieldContext } from "./field-context";
import { FieldFrame, isReported } from "./field-frame";
import { getAt } from "./document";
import {
  boundsOf,
  formEntries,
  isFraction,
  isLeaf,
  isRecord,
  labelOf,
  toRequirementSchema,
  pickVariant,
  unitsOf,
  variantsOf,
  type JsonSchema,
} from "./json-schema";
import { ScalarControl } from "./scalar-control";
import { FractionGroup, isFractionGroup } from "./fraction-group";
import { FilePicker, SeriesPicker } from "./series-picker";
import { ValueExtras } from "./value-extras";
import { toUnitChoices } from "./units";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

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

const selectClass = "aria-invalid:border-warn";

const branchClass = "ml-1.5 flex flex-col gap-2.5 border-l border-border pl-4";

function ModeButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button type="button" className="self-start text-[12px] text-accent" onClick={onClick}>
      {text}
    </button>
  );
}

function SeriesReference({
  name,
  path,
  label,
  schema,
  onConstant,
}: NodeProps & { onConstant?: (() => void) | undefined }) {
  return (
    <FieldFrame name={name} path={path} label={label} wide>
      {({ id }) => (
        <>
          <SeriesPicker id={id} name={name} label={label} units={unitsOf(schema)} />
          {onConstant === undefined ? null : <ModeButton text="constant" onClick={onConstant} />}
        </>
      )}
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
    <NativeSelect
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
      {typeof unit === "string" && units.includes(unit) ? null : (
        <NativeSelectOption value="">unit</NativeSelectOption>
      )}
      {toUnitChoices(units, unit).map((option) => (
        <NativeSelectOption key={option} value={option}>
          {option}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

function UnitWarning() {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-warn">
      <TriangleAlert aria-hidden="true" className="size-3.5" />
      choose a unit
    </span>
  );
}

function QuantityField({
  name,
  path,
  label,
  schema,
  optional = false,
  onSeries,
}: NodeProps & { onSeries?: (() => void) | undefined }) {
  const { control } = useFormContext();
  const { hints, prefix } = useFieldContext();
  const quantity: unknown = useWatch({ control, name });
  const units = unitsOf(schema);
  const valueSchema = schema.properties?.value ?? {};
  const lacksUnit =
    units.length > 0 &&
    isRecord(quantity) &&
    quantity.value !== undefined &&
    quantity.unit === undefined;
  const percent = isFraction(schema);
  return (
    <FieldFrame
      name={name}
      path={path}
      label={label}
      unit={percent ? "%" : undefined}
      hint={hints?.[toFullPath(prefix, path)] ?? boundsOf(schema)}
      description={schema.description}
      required={!optional}
    >
      {({ id, invalid, describedBy }) => (
        <>
          <div className="ml-1.5 flex flex-col gap-1.5 border-l border-border pl-4">
            <div className="grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
              <ScalarControl
                id={id}
                name={`${name}.value`}
                schema={valueSchema}
                invalid={invalid}
                describedBy={describedBy}
                scale={percent ? 100 : undefined}
              />
              <UnitControl
                name={`${name}.unit`}
                label={label}
                units={units}
                invalid={invalid || lacksUnit}
                disabled={!invalid && (!isRecord(quantity) || quantity.value === undefined)}
              />
            </div>
            {lacksUnit ? <UnitWarning /> : null}
            <div className="flex flex-wrap items-center gap-3">
              <ValueExtras name={name} label={label} schema={schema} />
              {onSeries === undefined ? null : <ModeButton text="∿ series" onClick={onSeries} />}
            </div>
          </div>
        </>
      )}
    </FieldFrame>
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
        <div className="max-w-md">
          <ScalarControl
            id={id}
            name={name}
            schema={schema}
            invalid={invalid}
            describedBy={describedBy}
          />
        </div>
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
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-mono text-[13px] font-medium">{title}</h3>
          {sentence === null ? null : <p className="text-[12.5px] text-muted">{sentence}</p>}
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${label}`} onClick={onRemove}>
          <Trash2 aria-hidden="true" className="size-3.5" />
        </Button>
      </div>
      <div
        className={`${branchClass} [&>fieldset>div]:ml-0 [&>fieldset>div]:border-l-0 [&>fieldset>div]:pl-0 [&>fieldset>legend]:sr-only`}
      >
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
    <div className="flex flex-col gap-3">
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

const openGroups = new Map<string, boolean>();

function useNeedsAttention(name: string, path: string): boolean {
  const { control } = useFormContext();
  const { errors } = useFormState({ control, name });
  const { prefix, missing, problems } = useFieldContext();
  const full = toFullPath(prefix, path);
  return (
    getAt(errors, name) !== undefined ||
    isReported(missing, full) ||
    problems.some((problem) => problem.path === full || problem.path.startsWith(`${full}.`))
  );
}

function CollapsibleGroup({
  name,
  path,
  label,
  strong,
  children,
}: {
  name: string;
  path: string;
  label: string;
  strong: boolean;
  children: ReactNode;
}) {
  const { prefix } = useFieldContext();
  const key = toFullPath(prefix, path);
  const needsAttention = useNeedsAttention(name, path);
  const [open, setOpen] = useState(() => openGroups.get(key) ?? needsAttention);
  useEffect(() => {
    if (needsAttention) setOpen(true);
  }, [needsAttention]);
  const titleClass = strong ? "font-medium text-text" : "font-medium text-muted-foreground";
  return (
    <details
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        openGroups.set(key, next);
        setOpen(next);
      }}
    >
      <summary className={`cursor-pointer text-[13px] ${titleClass}`}>
        {label}
        {needsAttention ? (
          <TriangleAlert
            aria-label="Needs a value or has a problem"
            className="ml-1.5 inline size-3.5 align-[-2px] text-warn"
          />
        ) : null}
      </summary>
      <div className={`mt-2.5 ${branchClass}`}>{children}</div>
    </details>
  );
}

function toDocumentOrder(
  entries: [string, JsonSchema][],
  current: unknown,
): [string, JsonSchema][] {
  const keys = isRecord(current) ? Object.keys(current) : [];
  const rank = (key: string) => {
    const index = keys.indexOf(key);
    return index < 0 ? keys.length : index;
  };
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry[0]) - rank(b.entry[0]) || a.index - b.index)
    .map(({ entry }) => entry);
}

function GroupFields(props: NodeProps) {
  const { name, path, label, optional = false } = props;
  const { control } = useFormContext();
  const current: unknown = useWatch({ control, name });
  const schema = toRequirementSchema(props.schema, current);
  if (isFractionGroup(schema) && path !== "") return <FractionGroup {...props} />;
  const entries = toDocumentOrder(formEntries(schema), current);
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
      <div className="flex flex-col gap-2.5">{basic.map(child)}</div>
      {advanced.length === 0 ? null : (
        <details>
          <summary className="cursor-pointer text-[12.5px] text-muted">Advanced</summary>
          <div className={`mt-2.5 ${branchClass}`}>{advanced.map(child)}</div>
        </details>
      )}
      {nested.map(child)}
    </>
  );
  if (path === "") return <div className="flex flex-col gap-3">{body}</div>;
  return (
    <CollapsibleGroup name={name} path={path} label={label} strong={!optional}>
      {body}
    </CollapsibleGroup>
  );
}

function toVariantLabel(variant: JsonSchema): string {
  if (isLeaf(variant)) return "Constant";
  if (variant.properties?.file !== undefined) return "Series from a file";
  if (variant.type === "string") return "From a file";
  return "Fill in here";
}

function SeriesSwitch(props: NodeProps & { leaf: JsonSchema; file: JsonSchema }) {
  const { leaf, file, ...node } = props;
  const { control, setValue } = useFormContext();
  const current: unknown = useWatch({ control, name: node.name });
  const [chosen, setChosen] = useState<boolean | null>(null);
  const series = chosen ?? (isRecord(current) && current.file !== undefined);
  const choose = (next: boolean) => {
    setChosen(next);
    setValue(node.name, undefined, { shouldDirty: true, shouldValidate: true });
  };
  if (series) {
    return (
      <SeriesReference
        {...node}
        schema={file}
        onConstant={() => {
          choose(false);
        }}
      />
    );
  }
  return (
    <QuantityField
      {...node}
      schema={leaf}
      onSeries={() => {
        choose(true);
      }}
    />
  );
}

function VariantBody(props: NodeProps) {
  if (props.schema.type === "string") {
    return <FilePicker id={props.path} name={props.name} label={props.label} />;
  }
  return <FieldNode {...props} />;
}

function fromFileContent(text: string): unknown {
  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function VariantField(props: NodeProps) {
  const { control, setValue } = useFormContext();
  const { series: source } = useFieldContext();
  const current: unknown = useWatch({ control, name: props.name });
  const [chosen, setChosen] = useState<number | null>(null);
  const variants = variantsOf(props.schema);
  const fitting = variants.indexOf(pickVariant(props.schema, current));
  const active = chosen ?? Math.max(0, fitting);
  const variant = variants[active] ?? {};
  const leaf = variants.find(isLeaf);
  const file = variants.find((option) => option.properties?.file !== undefined);
  if (leaf !== undefined && file !== undefined) {
    return <SeriesSwitch {...props} leaf={leaf} file={file} />;
  }
  return (
    <div className="col-span-full flex flex-col gap-2">
      <Tabs
        value={String(active)}
        onValueChange={(next) => {
          const target = variants[Number(next)] ?? {};
          if (typeof current === "string" && current !== "" && target.type !== "string") {
            if (source === undefined || !source.files.includes(current)) return;
            void source.read(current).then((text) => {
              const inline = fromFileContent(text);
              if (inline === undefined) return;
              setChosen(Number(next));
              setValue(props.name, inline, { shouldDirty: true, shouldValidate: true });
            });
            return;
          }
          setChosen(Number(next));
          setValue(props.name, undefined, { shouldDirty: true, shouldValidate: true });
        }}
      >
        <TabsList aria-label={`Form of ${props.label === "" ? "the value" : props.label}`}>
          {variants.map((option, index) => (
            <TabsTrigger key={toVariantLabel(option)} value={String(index)}>
              {toVariantLabel(option)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <VariantBody {...props} schema={variant} />
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
