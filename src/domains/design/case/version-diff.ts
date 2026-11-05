export type CaseEntry = { path: string; value: string; source: string };

export type CaseChange = {
  path: string;
  kind: "added" | "removed" | "changed";
  before: CaseEntry | undefined;
  after: CaseEntry | undefined;
};

type FileRow = { name: string; size: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function isValueLeaf(value: Record<string, unknown>): boolean {
  return "value" in value || "file" in value;
}

function toLeafText(leaf: Record<string, unknown>): string {
  const unit = typeof leaf.unit === "string" && leaf.unit !== "" ? ` ${leaf.unit}` : "";
  if ("file" in leaf) {
    const column = leaf.column === undefined ? "" : `, column ${toText(leaf.column)}`;
    return `file ${toText(leaf.file)}${column}${unit}`;
  }
  const extras = Object.entries(leaf)
    .filter(([key]) => !["value", "unit", "source"].includes(key))
    .map(([key, item]) => `${key} ${toText(item)}`);
  const main = `${toText(leaf.value)}${unit}`;
  return extras.length === 0 ? main : `${main} (${extras.join(", ")})`;
}

function walk(value: unknown, path: string, into: CaseEntry[]): void {
  if (isRecord(value)) {
    if (isValueLeaf(value)) {
      into.push({ path, value: toLeafText(value), source: toText(value.source) });
      return;
    }
    const keys = Object.keys(value);
    if (keys.length === 0 && path !== "") into.push({ path, value: "{}", source: "" });
    for (const key of keys) {
      if (key === "source" && path !== "") continue;
      walk(value[key], path === "" ? key : `${path}.${key}`, into);
    }
    if (path !== "" && "source" in value) {
      into.push({ path: `${path}.source`, value: toText(value.source), source: "" });
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.every((item) => !isRecord(item) && !Array.isArray(item))) {
      into.push({ path, value: value.map(toText).join(", "), source: "" });
      return;
    }
    value.forEach((item, index) => {
      walk(item, `${path}.${String(index)}`, into);
    });
    return;
  }
  into.push({ path, value: toText(value), source: "" });
}

/** Lists every value of a case content and its files as one row per path, in document order. */
export function toCaseEntries(content: unknown, files: readonly FileRow[] = []): CaseEntry[] {
  const entries: CaseEntry[] = [];
  walk(content, "", entries);
  for (const file of files) {
    entries.push({ path: `files.${file.name}`, value: `${String(file.size)} bytes`, source: "" });
  }
  return entries;
}

/** Compares two lists of case entries and returns the added, removed and changed paths. */
export function toCaseChanges(before: CaseEntry[], after: CaseEntry[]): CaseChange[] {
  const old = new Map(before.map((entry) => [entry.path, entry]));
  const next = new Map(after.map((entry) => [entry.path, entry]));
  const changes: CaseChange[] = [];
  for (const entry of after) {
    const previous = old.get(entry.path);
    if (previous === undefined) {
      changes.push({ path: entry.path, kind: "added", before: undefined, after: entry });
    } else if (previous.value !== entry.value || previous.source !== entry.source) {
      changes.push({ path: entry.path, kind: "changed", before: previous, after: entry });
    }
  }
  for (const entry of before) {
    if (!next.has(entry.path)) {
      changes.push({ path: entry.path, kind: "removed", before: entry, after: undefined });
    }
  }
  return changes;
}
