import { getAt } from "./document";
import { isLeaf, isRecord, pickVariant, variantsOf, type JsonSchema } from "./json-schema";

function isAbsent(schema: JsonSchema, value: unknown): boolean {
  if (value === undefined) return true;
  return isLeaf(schema) && isRecord(value) && value.value === undefined;
}

function join(path: string, name: string): string {
  return path === "" ? name : `${path}.${name}`;
}

function collect(schema: JsonSchema, value: unknown, path: string, found: string[]): void {
  const hasVariants = variantsOf(schema).length > 0;
  if (hasVariants && value === undefined) return;
  const target = hasVariants ? pickVariant(schema, value) : schema;
  if (isLeaf(target) || target.properties === undefined) return;
  const required = new Set(target.required ?? []);
  for (const [name, child] of Object.entries(target.properties)) {
    const childValue = getAt(value, name);
    const childPath = join(path, name);
    if (required.has(name) && isAbsent(pickVariant(child, childValue), childValue)) {
      found.push(childPath);
    }
    collect(child, childValue, childPath, found);
  }
}

/** Lists the paths of required properties that have no value; the server list stays the authority. */
export function findMissing(schema: JsonSchema, value: unknown): string[] {
  const found: string[] = [];
  collect(schema, value, "", found);
  return found;
}
