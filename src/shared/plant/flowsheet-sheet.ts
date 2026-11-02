import { toFanConnections } from "./auto-layout";
import { toModuleGroups } from "./groups";
import { splitPort, toWords } from "./spec";
import { find, join, toStem, type Parents } from "./streams";

export type SheetModule = { id: string; type: string; category: string };
export type SheetConnection = { source: string; target: string; stream: string | null };
export type SheetNode = { id: string; title: string; group: string; marks: string[] };
export type SheetEdge = { source: string; target: string; stream: string | null };
export type Sheet = { nodes: SheetNode[]; edges: SheetEdge[] };

const hiddenTypes = new Set(["Pipe", "Mixer", "Splitter"]);
const ambientStreams = new Set(["air", "heat"]);

function isAmbient(stream: string | null): boolean {
  return stream !== null && ambientStreams.has(stream);
}

/** Names a module in words; a short id such as d0 stays, after its type. */
export function toModuleTitle(module: SheetModule): string {
  if (module.id.length <= 3) return `${toWords(module.type).join(" ")} ${module.id}`;
  const words = module.id.replaceAll(".", " ").replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toPortsByModule(connections: SheetConnection[]): Map<string, Set<string>> {
  const ports = new Map<string, Set<string>>();
  for (const { source, target, stream } of connections) {
    if (isAmbient(stream)) continue;
    for (const reference of [source, target]) {
      const { module } = splitPort(reference);
      ports.set(module, (ports.get(module) ?? new Set()).add(reference));
    }
  }
  return ports;
}

function joinInsideModules(
  parents: Parents,
  modules: SheetModule[],
  connections: SheetConnection[],
) {
  const hidden = new Set(modules.filter(isHidden).map((module) => module.id));
  for (const [module, references] of toPortsByModule(connections)) {
    const stems = new Map<string, string>();
    for (const reference of references) {
      const stem = hidden.has(module) ? "" : toStem(splitPort(reference).port);
      const seen = stems.get(stem);
      if (seen !== undefined) join(parents, seen, reference);
      stems.set(stem, reference);
    }
  }
}

function isHidden(module: SheetModule): boolean {
  return hiddenTypes.has(module.type);
}

/** Fills the streams gemini leaves open, from the ports each connection and module join. */
export function toKnownStreams(
  modules: SheetModule[],
  connections: SheetConnection[],
): (string | null)[] {
  const parents: Parents = new Map();
  joinInsideModules(parents, modules, connections);
  for (const { source, target, stream } of connections) {
    if (stream === null) join(parents, source, target);
  }
  const known = new Map<string, string>();
  for (const { source, target, stream } of connections) {
    if (stream === null || isAmbient(stream)) continue;
    known.set(find(parents, source), stream);
    known.set(find(parents, target), stream);
  }
  return connections.map(
    ({ source, stream }) => stream ?? known.get(find(parents, source)) ?? null,
  );
}

function toMarks(connections: SheetConnection[], streams: (string | null)[]) {
  const marks = new Map<string, Set<string>>();
  const fans = toFanConnections(connections);
  connections.forEach(({ source, target }, index) => {
    const stream = streams[index] ?? null;
    if (!fans.has(index) || stream === null || isAmbient(stream)) return;
    for (const reference of [source, target]) {
      const { module } = splitPort(reference);
      marks.set(module, (marks.get(module) ?? new Set()).add(stream));
    }
  });
  return marks;
}

function toSteps(connections: SheetConnection[], streams: (string | null)[]): SheetEdge[] {
  const fans = toFanConnections(connections);
  return connections.flatMap((connection, index) => {
    if (fans.has(index)) return [];
    return [
      {
        source: splitPort(connection.source).module,
        target: splitPort(connection.target).module,
        stream: streams[index] ?? null,
      },
    ];
  });
}

function toPassedEdges(steps: SheetEdge[], hidden: Set<string>): SheetEdge[] {
  const flows = steps.filter((step) => !isAmbient(step.stream));
  const reach = (step: SheetEdge, seen: Set<string>): SheetEdge[] => {
    if (!hidden.has(step.target)) return [step];
    if (seen.has(step.target)) return [];
    seen.add(step.target);
    return flows
      .filter((next) => next.source === step.target)
      .flatMap((next) =>
        reach({ ...next, source: step.source, stream: step.stream ?? next.stream }, seen),
      );
  };
  return flows.filter((step) => !hidden.has(step.source)).flatMap((step) => reach(step, new Set()));
}

function toSignature(id: string, type: string, edges: SheetEdge[]): string {
  const sides = (from: "source" | "target", to: "source" | "target") =>
    edges
      .filter((edge) => edge[from] === id)
      .map((edge) => `${edge[to]}:${String(edge.stream)}`)
      .sort()
      .join(",");
  return `${type}|${sides("source", "target")}|${sides("target", "source")}`;
}

function toTwins(modules: SheetModule[], edges: SheetEdge[]): Map<string, string[]> {
  const twins = new Map<string, string[]>();
  for (const module of modules) {
    const key = toSignature(module.id, module.type, edges);
    twins.set(key, [...(twins.get(key) ?? []), module.id]);
  }
  const byId = new Map<string, string[]>();
  for (const ids of twins.values()) for (const id of ids) byId.set(id, ids);
  return byId;
}

function toUniqueEdges(edges: SheetEdge[], rename: (id: string) => string): SheetEdge[] {
  const unique = new Map<string, SheetEdge>();
  for (const edge of edges) {
    const source = rename(edge.source);
    const target = rename(edge.target);
    if (source === target) continue;
    unique.set(`${source}>${target}>${String(edge.stream)}`, {
      source,
      target,
      stream: edge.stream,
    });
  }
  return [...unique.values()];
}

function toNode(
  module: SheetModule,
  title: string,
  groups: Map<string, string>,
  marks: Set<string> | undefined,
): SheetNode {
  return {
    id: module.id,
    title,
    group: groups.get(module.id) ?? "other",
    marks: [...(marks ?? [])],
  };
}

function toGroups(
  modules: SheetModule[],
  connections: SheetConnection[],
  streams: (string | null)[],
) {
  const palette = modules.map((module) => ({ ...module, title: module.type, summary: "" }));
  return toModuleGroups(modules, connections, streams, palette);
}

/** Every module and every connection that is not a shared supply, for the appendix. */
export function toFullSheet(modules: SheetModule[], connections: SheetConnection[]): Sheet {
  const streams = toKnownStreams(modules, connections);
  const groups = toGroups(modules, connections, streams);
  const marks = toMarks(connections, streams);
  return {
    nodes: modules.map((module) =>
      toNode(module, toModuleTitle(module), groups, marks.get(module.id)),
    ),
    edges: toUniqueEdges(toSteps(connections, streams), (id) => id),
  };
}

/** The process as a reader follows it: no pipes, mixers or splitters, no air or heat losses, and modules alike in type and connections drawn once with a count. */
export function toSimpleSheet(modules: SheetModule[], connections: SheetConnection[]): Sheet {
  const streams = toKnownStreams(modules, connections);
  const groups = toGroups(modules, connections, streams);
  const marks = toMarks(connections, streams);
  const hidden = new Set(modules.filter(isHidden).map((module) => module.id));
  const shown = modules.filter((module) => !hidden.has(module.id));
  const passed = toPassedEdges(toSteps(connections, streams), hidden);
  const twins = toTwins(shown, passed);
  const rename = (id: string) => twins.get(id)?.[0] ?? id;
  const nodes = shown.flatMap((module) => {
    const ids = twins.get(module.id) ?? [module.id];
    if (ids[0] !== module.id) return [];
    const words = toWords(module.type).join(" ");
    const title = ids.length > 1 ? `${words}s ×${String(ids.length)}` : toModuleTitle(module);
    return [toNode(module, title, groups, marks.get(module.id))];
  });
  return { nodes, edges: toUniqueEdges(passed, rename) };
}
