export type JsonSchema = {
  type?: string;
  title?: string;
  description?: string;
  unit?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  pattern?: string;
  const?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  "x-units"?: string[];
  "x-limits"?: { min?: number; max?: number; unit?: string };
  "x-fraction"?: boolean;
  "x-roles"?: Record<string, Record<string, string[]>>;
  "x-time-units"?: string[];
};

export type Problem = { path: string; message: string; code?: string };

/** Tells whether an unknown value is a plain object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Lists the alternatives of an anyOf or oneOf node; empty for any other node. */
export function variantsOf(schema: JsonSchema): JsonSchema[] {
  return schema.anyOf ?? schema.oneOf ?? [];
}

/** Tells whether a node is a quantity: an object with a value and a unit, or a plain number value. */
export function isLeaf(schema: JsonSchema): boolean {
  const properties = schema.properties;
  if (properties?.value === undefined) return false;
  return properties.unit !== undefined || properties.value.type === "number";
}

/** Tells whether a quantity is a share of one, as gemini's schema marks it. */
export function isFraction(schema: JsonSchema): boolean {
  return schema["x-fraction"] === true;
}

function fitsType(schema: JsonSchema, value: unknown): boolean {
  if (schema.type === "string") return typeof value === "string";
  if (schema.type === "number" || schema.type === "integer") return typeof value === "number";
  if (schema.type === "boolean") return typeof value === "boolean";
  if (schema.type === "array") return Array.isArray(value);
  if (!isRecord(value)) return false;
  const known = schema.properties ?? {};
  return Object.keys(value).every((key) => known[key] !== undefined);
}

/** Chooses the alternative of an anyOf or oneOf node that fits the current value. */
export function pickVariant(schema: JsonSchema, value: unknown): JsonSchema {
  const variants = variantsOf(schema);
  const fitting = variants.find((variant) => value !== undefined && fitsType(variant, value));
  const form = variants.find((variant) => variant.properties !== undefined);
  return fitting ?? variants.find(isLeaf) ?? form ?? variants[0] ?? schema;
}

const headerKeys = ["format", "kind", "name"];

/** Tells whether an object is a file of its own, whose header the form sets itself. */
export function hasHeader(schema: JsonSchema): boolean {
  return schema.properties?.format?.const !== undefined;
}

/** Lists the properties a form shows: the header of a file of its own is left out. */
export function formEntries(schema: JsonSchema): [string, JsonSchema][] {
  const entries = Object.entries(schema.properties ?? {});
  if (!hasHeader(schema)) return entries;
  return entries.filter(([key]) => !headerKeys.includes(key));
}

/** Adds the header to an object filled in the form when its schema is a file of its own. */
export function withHeader(schema: JsonSchema, name: string, value: unknown): unknown {
  const form = pickVariant(schema, value);
  if (!isRecord(value) || !hasHeader(form) || Object.keys(value).length === 0) return value;
  return { format: form.properties?.format?.const, kind: name, name, ...value };
}

/** Lists the units a quantity node accepts, from the enum or const of its unit property. */
export function unitsOf(schema: JsonSchema): string[] {
  if (schema["x-units"] !== undefined) return schema["x-units"];
  const unit = schema.properties?.unit;
  if (unit === undefined) return typeof schema.unit === "string" ? [schema.unit] : [];
  const options = unit.enum ?? (unit.const === undefined ? [] : [unit.const]);
  return options.filter((option): option is string => typeof option === "string");
}

/** Writes the bounds of a number node as a hint, or nothing when it has none. */
export function boundsOf(schema: JsonSchema): string | undefined {
  const limits = schema["x-limits"];
  if (isFraction(schema)) return undefined;
  const low = limits?.min ?? schema.minimum ?? schema.exclusiveMinimum;
  const high = limits?.max ?? schema.maximum ?? schema.exclusiveMaximum;
  const unit = limits?.unit === undefined ? "" : ` ${limits.unit}`;
  if (low !== undefined && high !== undefined) {
    return `between ${String(low)} and ${String(high)}${unit}`;
  }
  if (low !== undefined) return `at least ${String(low)}${unit}`;
  return high === undefined ? undefined : `at most ${String(high)}${unit}`;
}

/** Narrows a requirement's quantity and unit to what its role and quantity allow. */
export function toRequirementSchema(schema: JsonSchema, value: unknown): JsonSchema {
  const roles = schema["x-roles"];
  const properties = schema.properties;
  if (roles === undefined || properties === undefined || !isRecord(value)) return schema;
  const quantities = typeof value.on === "string" ? roles[value.on] : undefined;
  if (quantities === undefined) return schema;
  const quantity = typeof value.quantity === "string" ? value.quantity : "";
  const units = value.over === "duration" ? schema["x-time-units"] : quantities[quantity];
  return {
    ...schema,
    properties: {
      ...properties,
      quantity: { ...properties.quantity, enum: Object.keys(quantities) },
      ...(units === undefined || units.length === 0
        ? {}
        : { unit: { ...properties.unit, enum: units } }),
    },
  };
}

/** Makes a readable label from a property name unless the schema has a title. */
export function labelOf(name: string, schema: JsonSchema): string {
  if (schema.title !== undefined) return schema.title;
  const words = name.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function isStructured(schema: JsonSchema): boolean {
  if (schema.properties !== undefined || schema.type === "array") return true;
  return variantsOf(schema).some(isStructured);
}

/** Lists the top-level property names that are sections: objects, lists or alternatives of them. */
export function sectionsOf(schema: JsonSchema): string[] {
  return Object.entries(schema.properties ?? {})
    .filter(([, child]) => isStructured(child))
    .map(([name]) => name);
}

/** Returns the schema of one top-level property, or undefined when it does not exist. */
export function sectionSchema(schema: JsonSchema, name: string): JsonSchema | undefined {
  return schema.properties?.[name];
}
