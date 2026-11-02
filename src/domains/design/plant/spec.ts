import { isRecord } from "@/shared/forms/json-schema";
import type { ModulePorts, PortKind } from "@/shared/api/types";
import type { Layout } from "@/shared/api/layout";
import type { PlantSpec } from "./types";

export type SpecModule = { id: string; type: string };
export type SpecConnection = { source: string; target: string };
export type PortRef = { module: string; port: string };

const groupTypes = new Set(["ModuleList", "ModuleDict"]);

function walkModules(tree: unknown, prefix: string): SpecModule[] {
  if (!isRecord(tree)) return [];
  return Object.entries(tree).flatMap(([name, body]) => {
    if (!isRecord(body) || typeof body.type !== "string") return [];
    const id = `${prefix}${name}`;
    if (isRecord(body.modules) && Object.keys(body.modules).length > 0)
      return walkModules(body.modules, `${id}.`);
    return groupTypes.has(body.type) ? [] : [{ id, type: body.type }];
  });
}

/** Lists the equipment of a plant document by dotted path; groups are walked, not listed. */
export function readModules(spec: PlantSpec): SpecModule[] {
  return walkModules(spec.modules, "");
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

/** Splits "module.port" at the last dot; a module path may hold dots, a port name never does. */
export function splitPort(reference: string): PortRef {
  const dot = reference.lastIndexOf(".");
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

function mapAt(
  record: unknown,
  path: string[],
  change: (container: Record<string, unknown>, key: string) => Record<string, unknown>,
  descend: (body: Record<string, unknown>) => string,
): Record<string, unknown> {
  const container = isRecord(record) ? record : {};
  const [key, ...rest] = path;
  if (key === undefined) return container;
  if (rest.length === 0) return change(container, key);
  const body = container[key];
  if (!isRecord(body)) return container;
  const field = descend(body);
  const inner = field === "" ? body : body[field];
  const next = mapAt(inner, rest, change, descend);
  return { ...container, [key]: field === "" ? next : { ...body, [field]: next } };
}

function dropKey(container: Record<string, unknown>, key: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(container).filter(([name]) => name !== key));
}

const inModules = () => "modules";
const inParams = () => "";

/** Returns a spec without a module, its connections and its parameters. */
export function withoutModule(spec: PlantSpec, id: string): PlantSpec {
  const kept = readConnections(spec).filter(
    (item) => splitPort(item.source).module !== id && splitPort(item.target).module !== id,
  );
  const path = id.split(".");
  const next: PlantSpec = {
    ...spec,
    modules: mapAt(spec.modules, path, dropKey, inModules),
    connections: kept,
  };
  if (isRecord(spec.params)) next.params = mapAt(spec.params, path, dropKey, inParams);
  return next;
}

function renamedRef(reference: string, from: string, to: string): string {
  const { module, port } = splitPort(reference);
  return module === from ? `${to}.${port}` : reference;
}

function renamer(to: string) {
  return (container: Record<string, unknown>, key: string) =>
    Object.fromEntries(
      Object.entries(container).map(([name, body]) => [name === key ? to : name, body]),
    );
}

/** Returns a spec where a module path is renamed everywhere: modules, connections and parameters. */
export function withRenamedModule(spec: PlantSpec, from: string, to: string): PlantSpec {
  const path = from.split(".");
  const last = to.split(".").at(-1) ?? to;
  const next: PlantSpec = {
    ...spec,
    modules: mapAt(spec.modules, path, renamer(last), inModules),
    connections: readConnections(spec).map((item) => ({
      source: renamedRef(item.source, from, to),
      target: renamedRef(item.target, from, to),
    })),
  };
  if (isRecord(spec.params)) next.params = mapAt(spec.params, path, renamer(last), inParams);
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

export type PortKinds = {
  inlets: Map<string, string | null>;
  outlets: Map<string, string | null>;
};

function toKinds(ports: PortKind[]): Map<string, string | null> {
  return new Map(ports.map((entry) => [entry.port, entry.kind]));
}

/** Gives every module of a plant document its inlets and outlets, with gemini's stream kinds, from the port catalog. */
export function toPorts(modules: SpecModule[], catalog: ModulePorts[]): Map<string, PortKinds> {
  const byType = new Map(catalog.map((entry) => [entry.type, entry]));
  return new Map(
    modules.map((module) => {
      const entry = byType.get(module.type);
      const ports: PortKinds = {
        inlets: toKinds(entry?.inlets ?? []),
        outlets: toKinds(entry?.outlets ?? []),
      };
      return [module.id, ports];
    }),
  );
}

/** Tells whether an outlet may feed an inlet: both ports must exist and known stream kinds must be equal. */
export function isSameKind(
  ports: Map<string, PortKinds>,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
): boolean {
  const outlets = ports.get(source)?.outlets;
  const inlets = ports.get(target)?.inlets;
  if (!outlets?.has(sourceHandle) || !inlets?.has(targetHandle)) return false;
  const from = outlets.get(sourceHandle);
  const to = inlets.get(targetHandle);
  if (from === null || from === undefined || to === null || to === undefined) return true;
  return from === to;
}

/** Finds the module ids a validation problem path points at: modules.<id>, params.<id>, connections.<n>, <id>.<port>. */
export function modulesOfProblem(
  path: string,
  connections: SpecConnection[],
  ids: string[],
): string[] {
  const [area, ...rest] = path.split(".");
  if (area === "connections" && rest[0] !== undefined) {
    const connection = connections[Number(rest[0])];
    if (connection === undefined) return [];
    return [splitPort(connection.source).module, splitPort(connection.target).module];
  }
  const parts = area === "modules" || area === "params" ? rest : path.split(".");
  for (let length = parts.length; length > 0; length -= 1) {
    const found = parts.slice(0, length).join(".");
    if (ids.includes(found)) return [found];
  }
  return [];
}

/** Checks a new module id: not empty, no dot or space, not taken; returns the message or null when fine. */
export function checkModuleId(spec: PlantSpec, current: string, next: string): string | null {
  if (next.trim() === "") return "The id cannot be empty";
  const parent = current.includes(".") ? current.slice(0, current.lastIndexOf(".") + 1) : "";
  if (!next.startsWith(parent) || /[.\s]/.test(next.slice(parent.length)))
    return "The id cannot contain dots or spaces";
  const taken = readModules(spec).some((module) => module.id === next && module.id !== current);
  return taken ? "Another module already has this id" : null;
}
