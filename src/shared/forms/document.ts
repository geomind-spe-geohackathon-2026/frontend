import { isRecord } from "./json-schema";

/** Converts a path with list indexes (a[0].b) into dotted form (a.0.b). */
export function toDotted(path: string): string {
  return path.replace(/\[(\d+)\]/g, ".$1").replace(/^\./, "");
}

/** Reads the value at a dotted path; undefined when any step is absent. */
export function getAt(root: unknown, path: string): unknown {
  if (path === "") return root;
  let current = root;
  for (const step of toDotted(path).split(".")) {
    if (Array.isArray(current)) current = current[Number(step)];
    else if (isRecord(current)) current = current[step];
    else return undefined;
  }
  return current;
}

function pruneList(items: unknown[]): unknown[] {
  return items.map((item) => (isRecord(item) ? (prune(item) ?? {}) : prune(item)));
}

/** Removes undefined values and empty objects, and sorts keys, so equal documents compare equal. */
export function prune(value: unknown): unknown {
  if (Array.isArray(value)) return pruneList(value);
  if (!isRecord(value)) return value;
  const entries = Object.keys(value)
    .sort()
    .map((key): [string, unknown] => [key, prune(value[key])])
    .filter(([, child]) => child !== undefined);
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

/** Tells whether two documents are equal once empty and undefined parts are ignored. */
export function isEqualDocument(first: unknown, second: unknown): boolean {
  return JSON.stringify(prune(first)) === JSON.stringify(prune(second));
}
