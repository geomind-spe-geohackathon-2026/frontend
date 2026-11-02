import { isRecord } from "@/shared/forms/json-schema";
import type { FlowsheetConnection } from "@/shared/api/types";
import type { Layout } from "@/shared/api/layout";
import type { PlantSpec } from "./types";

export type SpecModule = { id: string; type: string };
export type SpecConnection = { source: string; target: string };
export type PortRef = { module: string; port: string };

/** Lists the modules of a plant document: id and gemini class name. */
export function readModules(spec: PlantSpec): SpecModule[] {
  const modules = spec.modules;
  if (!isRecord(modules)) return [];
  return Object.entries(modules).flatMap(([id, body]) =>
    isRecord(body) && typeof body.type === "string" ? [{ id, type: body.type }] : [],
  );
}

/** Lists the connections of a plant document as source and target port references. */
export function readConnections(spec: PlantSpec): SpecConnection[] {
  const connections = spec.connections;
  if (!Array.isArray(connections)) return [];
  return connections.flatMap((item: unknown) => {
    if (!isRecord(item)) return [];
    const { source, target } = item;
    return typeof source === "string" && typeof target === "string" ? [{ source, target }] : [];
  });
}

/** Splits "module.port" at the first dot; the module id never contains a dot. */
export function splitPort(reference: string): PortRef {
  const dot = reference.indexOf(".");
  if (dot < 0) return { module: reference, port: "" };
  return { module: reference.slice(0, dot), port: reference.slice(dot + 1) };
}

/** Makes a snake_case id from a gemini class name: HeatExchanger becomes heat_exchanger. */
export function toIdBase(type: string): string {
  return type.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

/** Suggests a free module id for a type: the snake_case name, then name_2, name_3. */
export function nextModuleId(spec: PlantSpec, type: string): string {
  const taken = new Set(readModules(spec).map((module) => module.id));
  const base = toIdBase(type);
  if (!taken.has(base)) return base;
  let count = 2;
  while (taken.has(`${base}_${String(count)}`)) count += 1;
  return `${base}_${String(count)}`;
}

function modulesOf(spec: PlantSpec): Record<string, unknown> {
  return isRecord(spec.modules) ? spec.modules : {};
}

/** Returns a spec with one more module of the given type. */
export function withModule(spec: PlantSpec, id: string, type: string): PlantSpec {
  return { ...spec, modules: { ...modulesOf(spec), [id]: { type } } };
}

function withoutKey(record: unknown, key: string): Record<string, unknown> {
  const entries = isRecord(record) ? Object.entries(record) : [];
  return Object.fromEntries(entries.filter(([name]) => name !== key));
}

/** Returns a spec without a module, its connections and its parameters. */
export function withoutModule(spec: PlantSpec, id: string): PlantSpec {
  const kept = readConnections(spec).filter(
    (item) => splitPort(item.source).module !== id && splitPort(item.target).module !== id,
  );
  const next: PlantSpec = {
    ...spec,
    modules: withoutKey(spec.modules, id),
    connections: kept,
  };
  if (isRecord(spec.params)) next.params = withoutKey(spec.params, id);
  return next;
}

function renamedRef(reference: string, from: string, to: string): string {
  const { module, port } = splitPort(reference);
  return module === from ? `${to}.${port}` : reference;
}

function renamedKey(record: Record<string, unknown>, from: string, to: string) {
  return Object.fromEntries(
    Object.entries(record).map(([key, body]) => [key === from ? to : key, body]),
  );
}

/** Returns a spec where a module id is renamed everywhere: modules, connections and parameters. */
export function withRenamedModule(spec: PlantSpec, from: string, to: string): PlantSpec {
  const next: PlantSpec = {
    ...spec,
    modules: renamedKey(modulesOf(spec), from, to),
    connections: readConnections(spec).map((item) => ({
      source: renamedRef(item.source, from, to),
      target: renamedRef(item.target, from, to),
    })),
  };
  if (isRecord(spec.params)) next.params = renamedKey(spec.params, from, to);
  return next;
}

/** Returns a spec with one more connection. */
export function withConnection(spec: PlantSpec, connection: SpecConnection): PlantSpec {
  return { ...spec, connections: [...readConnections(spec), connection] };
}

/** Returns a spec without the connection at the given index. */
export function withoutConnection(spec: PlantSpec, index: number): PlantSpec {
  return { ...spec, connections: readConnections(spec).filter((_, at) => at !== index) };
}

/** Returns a layout where one node moved. */
export function withPosition(layout: Layout, id: string, x: number, y: number): Layout {
  return { ...layout, [id]: { x, y } };
}

/** Returns a layout renamed along with a module id. */
export function withRenamedPosition(layout: Layout, from: string, to: string): Layout {
  return renamedKeyLayout(layout, from, to);
}

function renamedKeyLayout(layout: Layout, from: string, to: string): Layout {
  return Object.fromEntries(
    Object.entries(layout).map(([key, at]) => [key === from ? to : key, at]),
  );
}

export type PortKinds = { inlets: Map<string, string>; outlets: Map<string, string> };

/** Learns, per module type, which ports exist and what stream each carries, from saved connections. */
export function learnPorts(
  types: Map<string, string>,
  connections: FlowsheetConnection[],
): Map<string, PortKinds> {
  const known = new Map<string, PortKinds>();
  const kindsOf = (type: string): PortKinds => {
    const existing = known.get(type);
    if (existing !== undefined) return existing;
    const created: PortKinds = { inlets: new Map(), outlets: new Map() };
    known.set(type, created);
    return created;
  };
  for (const connection of connections) {
    const from = splitPort(connection.source);
    const to = splitPort(connection.target);
    const fromType = types.get(from.module);
    const toType = types.get(to.module);
    if (fromType !== undefined) kindsOf(fromType).outlets.set(from.port, connection.stream ?? "");
    if (toType !== undefined) kindsOf(toType).inlets.set(to.port, connection.stream ?? "");
  }
  return known;
}

/** Finds the module ids a validation problem path points at: modules.<id>, params.<id>, connections.<n>. */
export function modulesOfProblem(path: string, connections: SpecConnection[]): string[] {
  const [area, key] = path.split(".");
  if ((area === "modules" || area === "params") && key !== undefined) return [key];
  if (area !== "connections" || key === undefined) return [];
  const connection = connections[Number(key)];
  if (connection === undefined) return [];
  return [splitPort(connection.source).module, splitPort(connection.target).module];
}

/** Collects the known ports of every module: learned per type, plus the ports its connections use. */
export function portsFor(
  modules: SpecModule[],
  connections: SpecConnection[],
  learned: Map<string, PortKinds>,
): Map<string, PortKinds> {
  const result = new Map<string, PortKinds>();
  for (const module of modules) {
    const known = learned.get(module.type);
    result.set(module.id, {
      inlets: new Map(known?.inlets),
      outlets: new Map(known?.outlets),
    });
  }
  for (const connection of connections) {
    const from = splitPort(connection.source);
    const to = splitPort(connection.target);
    const outlets = result.get(from.module)?.outlets;
    const inlets = result.get(to.module)?.inlets;
    if (outlets !== undefined && !outlets.has(from.port)) outlets.set(from.port, "");
    if (inlets !== undefined && !inlets.has(to.port)) inlets.set(to.port, "");
  }
  return result;
}

/** Checks a new module id: not empty, no dot or space, not taken; returns the message or null when fine. */
export function checkModuleId(spec: PlantSpec, current: string, next: string): string | null {
  if (next.trim() === "") return "The id cannot be empty";
  if (/[.\s]/.test(next)) return "The id cannot contain dots or spaces";
  const taken = readModules(spec).some((module) => module.id === next && module.id !== current);
  return taken ? "Another module already has this id" : null;
}
