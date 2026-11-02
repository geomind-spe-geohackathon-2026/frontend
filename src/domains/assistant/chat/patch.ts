import type { StateChange } from "@/shared/sse/types";

type Container = Record<string, unknown> | unknown[];

function isContainer(value: unknown): value is Container {
  return typeof value === "object" && value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isContainer(value) && !Array.isArray(value);
}

function toSegments(path: string): string[] {
  return path
    .split("/")
    .slice(1)
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function toIndex(list: unknown[], segment: string): number {
  const byId = list.findIndex((item) => isRecord(item) && item.id === segment);
  if (byId >= 0) return byId;
  return /^\d+$/.test(segment) ? Number(segment) : -1;
}

function changeList(list: unknown[], segment: string, change: StateChange): unknown[] | null {
  if (change.op === "add" && segment === "-") return [...list, change.value];
  const index = toIndex(list, segment);
  const exists = index >= 0 && index < list.length;
  if (change.op === "add" && !exists && index !== list.length) return null;
  if (change.op !== "add" && !exists) return null;
  const next = [...list];
  if (change.op === "remove") next.splice(index, 1);
  else if (change.op === "replace" || exists) next[index] = change.value;
  else next.push(change.value);
  return next;
}

function changeRecord(
  record: Record<string, unknown>,
  key: string,
  change: StateChange,
): Record<string, unknown> | null {
  if (change.op === "remove") {
    if (!(key in record)) return null;
    return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));
  }
  if (change.op === "replace" && !(key in record)) return null;
  return { ...record, [key]: change.value };
}

function readChild(container: Container, segment: string): unknown {
  if (Array.isArray(container)) return container[toIndex(container, segment)];
  return container[segment];
}

function writeChild(container: Container, segment: string, child: unknown): Container {
  if (!Array.isArray(container)) return { ...container, [segment]: child };
  const next = [...container];
  next[toIndex(container, segment)] = child;
  return next;
}

function update(node: unknown, segments: string[], change: StateChange): unknown {
  const [head, ...rest] = segments;
  if (head === undefined || !isContainer(node)) return null;
  if (rest.length === 0) {
    return Array.isArray(node) ? changeList(node, head, change) : changeRecord(node, head, change);
  }
  const child = update(readChild(node, head), rest, change);
  return child === null ? null : writeChild(node, head, child);
}

/** Applies RFC 6902 add, replace and remove operations; lists with ids are addressed by id. Returns null when a path does not exist. */
export function applyChanges(document: unknown, changes: StateChange[]): unknown {
  let current: unknown = document ?? {};
  for (const change of changes) {
    current = update(current, toSegments(change.path), change);
    if (current === null) return null;
  }
  return current;
}
