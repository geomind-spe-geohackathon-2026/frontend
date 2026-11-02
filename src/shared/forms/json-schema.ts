export type JsonSchema = {
  type?: string;
  title?: string;
  description?: string;
  unit?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  minimum?: number;
  maximum?: number;
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

/** Tells whether a node is a quantity: an object with a value and a unit property. */
export function isLeaf(schema: JsonSchema): boolean {
  const properties = schema.properties;
  return properties?.value !== undefined && properties.unit !== undefined;
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
  return fitting ?? variants.find(isLeaf) ?? variants[0] ?? schema;
}

/** Lists the units a quantity node accepts, from the enum or const of its unit property. */
export function unitsOf(schema: JsonSchema): string[] {
  const unit = schema.properties?.unit;
  if (unit === undefined) return typeof schema.unit === "string" ? [schema.unit] : [];
  const options = unit.enum ?? (unit.const === undefined ? [] : [unit.const]);
  return options.filter((option): option is string => typeof option === "string");
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
