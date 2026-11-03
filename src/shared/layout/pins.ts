import { useSyncExternalStore } from "react";

export type Pin = { kind: "project" | "chat"; id: string; projectId: string; title: string };

const storageKey = "geomind.pins";
const listeners = new Set<() => void>();

function isPin(value: unknown): value is Pin {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    "id" in value &&
    "projectId" in value &&
    "title" in value &&
    (value.kind === "project" || value.kind === "chat") &&
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.title === "string"
  );
}

function toRaw(): string {
  try {
    return window.localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "[]";
  }
}

let cache: { raw: string; pins: Pin[] } = { raw: "", pins: [] };

function toPins(): Pin[] {
  const raw = toRaw();
  if (raw === cache.raw) return cache.pins;
  let parsed: unknown = [];
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = [];
  }
  const pins = Array.isArray(parsed) ? parsed.filter(isPin) : [];
  cache = { raw, pins };
  return pins;
}

function save(pins: Pin[]): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(pins));
  } catch {
    return;
  }
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Pins or unpins a project or chat; pins live in this browser only. */
export function togglePin(pin: Pin): void {
  const pins = toPins();
  const pinned = pins.some((item) => item.kind === pin.kind && item.id === pin.id);
  save(
    pinned
      ? pins.filter((item) => !(item.kind === pin.kind && item.id === pin.id))
      : [...pins, pin],
  );
}

/** The pinned projects and chats of this browser, in the order they were pinned. */
export function usePins(): Pin[] {
  return useSyncExternalStore(subscribe, toPins);
}

/** Whether a project or chat is pinned in this browser. */
export function isPinned(pins: Pin[], kind: Pin["kind"], id: string): boolean {
  return pins.some((pin) => pin.kind === kind && pin.id === id);
}
