import {
  isRecord,
  labelOf,
  unitsOf,
  variantsOf,
  type JsonSchema,
} from "@/shared/forms/json-schema";

type PropertySchema = JsonSchema & {
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  prefixItems?: JsonSchema[];
  minItems?: number;
  maxItems?: number;
  quantity?: string;
};

export type FieldKind = "number" | "integer" | "choice" | "text" | "flag" | "list" | "record";

export type Bound = { limit: number; strict: boolean };

export type ParameterField = {
  name: string;
  group: string;
  local: string;
  label: string;
  kind: FieldKind;
  unit: string | null;
  units: string[];
  options: string[];
  lower: Bound | null;
  upper: Bound | null;
  length: number | null;
  nullable: boolean;
  description: string | null;
};

export type FieldEdit = { text: string; unit: string | null };

export type FieldResult = { value: unknown; problem: string | null };

function isNull(variant: JsonSchema): boolean {
  return variant.type === "null";
}

function toMainVariant(schema: PropertySchema): PropertySchema {
  const variants: PropertySchema[] = variantsOf(schema);
  return (
    variants.find((variant) => !isNull(variant) && variant.properties?.value === undefined) ??
    schema
  );
}

function toKind(main: PropertySchema): FieldKind {
  if (main.enum !== undefined) return "choice";
  if (main.type === "number") return "number";
  if (main.type === "integer") return "integer";
  if (main.type === "boolean") return "flag";
  if (main.type === "array") return "list";
  if (main.type === "string") return "text";
  return "record";
}

function toBound(inclusive: number | undefined, exclusive: number | undefined): Bound | null {
  if (exclusive !== undefined) return { limit: exclusive, strict: true };
  return inclusive === undefined ? null : { limit: inclusive, strict: false };
}

function toUnits(schema: PropertySchema): string[] {
  const quantity = variantsOf(schema).find((variant) => variant.properties?.value !== undefined);
  if (quantity !== undefined) return unitsOf(quantity);
  return typeof schema.unit === "string" ? [schema.unit] : [];
}

function toField(name: string, schema: PropertySchema): ParameterField {
  const main = toMainVariant(schema);
  const dot = name.lastIndexOf(".");
  const local = name.slice(dot + 1);
  return {
    name,
    group: dot < 0 ? "" : name.slice(0, dot),
    local,
    label: labelOf(local, schema),
    kind: toKind(main),
    unit: schema.unit ?? null,
    units: toUnits(schema),
    options: (main.enum ?? []).map(String),
    lower: toBound(main.minimum, main.exclusiveMinimum),
    upper: toBound(main.maximum, main.exclusiveMaximum),
    length: main.minItems === main.maxItems ? (main.minItems ?? null) : null,
    nullable: variantsOf(schema).some(isNull),
    description: schema.description ?? null,
  };
}

/** Reads one field per module parameter from gemini's schema; a child's parameters keep their dotted name and group. */
export function toParameterFields(schema: PropertySchema): ParameterField[] {
  return Object.entries(schema.properties ?? {}).map(([name, property]) => toField(name, property));
}

/** Lists the child modules whose parameters a schema carries, in schema order. */
export function toGroups(fields: ParameterField[]): string[] {
  return [...new Set(fields.map((field) => field.group))].filter((group) => group !== "");
}

/** Writes a stored value as the text of its input; an absent value is empty. */
export function toFieldText(field: ParameterField, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (field.kind === "list" && Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function toLimit(bound: Bound): string {
  return String(bound.limit);
}

/** Describes the allowed range of a field in its schema unit, or null when it has no limit. */
export function toRangeText(field: ParameterField): string | null {
  const { lower, upper } = field;
  if (lower === null && upper === null) return null;
  if (lower !== null && upper !== null) {
    const left = lower.strict ? "above " : "";
    const right = upper.strict ? "below " : "";
    return `${left}${toLimit(lower)} to ${right}${toLimit(upper)}`;
  }
  if (lower !== null) return `${lower.strict ? ">" : "≥"} ${toLimit(lower)}`;
  return upper === null ? null : `${upper.strict ? "<" : "≤"} ${toLimit(upper)}`;
}

function checkBounds(field: ParameterField, value: number): string | null {
  const { lower, upper } = field;
  const isLow = lower !== null && (lower.strict ? value <= lower.limit : value < lower.limit);
  const isHigh = upper !== null && (upper.strict ? value >= upper.limit : value > upper.limit);
  if (!isLow && !isHigh) return null;
  return `Must be ${toRangeText(field) ?? ""}`;
}

function checkNumber(field: ParameterField, value: number, unit: string | null): string | null {
  if (Number.isNaN(value)) return "Must be a number";
  if (field.kind === "integer" && !Number.isInteger(value)) return "Must be a whole number";
  return unit === field.unit ? checkBounds(field, value) : null;
}

function toList(field: ParameterField, text: string): FieldResult {
  const items = text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "")
    .map(Number);
  if (items.some(Number.isNaN))
    return { value: null, problem: "Must be numbers separated by commas" };
  if (field.length !== null && items.length !== field.length) {
    return { value: null, problem: `Must have ${String(field.length)} values` };
  }
  return { value: items, problem: null };
}

function toRecord(text: string): FieldResult {
  try {
    const value: unknown = JSON.parse(text);
    if (isRecord(value)) return { value, problem: null };
  } catch {
    return { value: null, problem: "Must be a JSON object" };
  }
  return { value: null, problem: "Must be a JSON object" };
}

function toPlain(field: ParameterField, text: string, unit: string | null): FieldResult {
  if (field.kind === "list") return toList(field, text);
  if (field.kind === "record") return toRecord(text);
  if (field.kind === "flag") return { value: text === "true", problem: null };
  if (field.kind === "number" || field.kind === "integer") {
    const value = Number(text);
    return { value, problem: checkNumber(field, value, unit) };
  }
  return { value: text, problem: null };
}

function isDimensionless(unit: string | null): boolean {
  return unit === null || unit === "-";
}

/** Turns an edit into what the server takes: a number with a dimension is sent with its unit, a cleared value as null. */
export function toFieldResult(field: ParameterField, edit: FieldEdit): FieldResult {
  if (edit.text.trim() === "") {
    return field.nullable
      ? { value: null, problem: null }
      : { value: null, problem: "This value cannot be empty" };
  }
  const plain = toPlain(field, edit.text, edit.unit);
  if (plain.problem !== null || isDimensionless(edit.unit)) return plain;
  return { value: { value: plain.value, unit: edit.unit }, problem: null };
}
