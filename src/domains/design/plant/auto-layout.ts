import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import { groupOrder, type Size } from "./groups";
import { splitPort, type PortKinds, type SpecConnection, type SpecModule } from "./spec";
import type { Layout } from "@/shared/api/layout";

export const nodeWidth = 240;
export const headerHeight = 60;
export const portRowHeight = 26;

const bottomPadding = 10;
const minimumRows = 1;
const fanSize = 3;

async function createElk() {
  const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
  return new ELK();
}

let elk: ReturnType<typeof createElk> | null = null;

/** Sizes a node from its port rows, the same in the layout and on the canvas. */
export function toNodeSize(ports: PortKinds | undefined): Size {
  const rows = Math.max(ports?.inlets.size ?? 0, ports?.outlets.size ?? 0, minimumRows);
  return { width: nodeWidth, height: headerHeight + rows * portRowHeight + bottomPadding };
}

export type Bounds = { x: number; y: number; width: number; height: number };

export type Viewport = { x: number; y: number; zoom: number };

/** Fits a plant in the view, but no smaller than a readable zoom; what does not fit starts at its left, with the first group in the middle of the height. */
export function toStartViewport(
  bounds: Bounds,
  view: Size,
  limits: { minimum: number; maximum: number; margin: number },
  first: Bounds,
): Viewport {
  const room = { width: view.width - 2 * limits.margin, height: view.height - 2 * limits.margin };
  const fit = Math.min(room.width / bounds.width, room.height / bounds.height);
  const zoom = Math.min(limits.maximum, Math.max(limits.minimum, fit));
  const width = bounds.width * zoom;
  const height = bounds.height * zoom;
  const x = width <= room.width ? (view.width - width) / 2 : limits.margin;
  const centred = view.height / 2 - (first.y + first.height / 2 - bounds.y) * zoom;
  const lowest = view.height - limits.margin - height;
  const clamped = Math.min(limits.margin, Math.max(lowest, centred));
  const y = height <= room.height ? (view.height - height) / 2 : clamped;
  return { x: x - bounds.x * zoom, y: y - bounds.y * zoom, zoom };
}

function toPortY(index: number): number {
  return headerHeight + (index + 0.5) * portRowHeight;
}

function toElkPorts(id: string, ports: PortKinds | undefined) {
  const side = (names: string[], x: number, elkSide: string) =>
    names.map((name, index) => ({
      id: `${id}.${name}`,
      x,
      y: toPortY(index),
      width: 0,
      height: 0,
      layoutOptions: { "elk.port.side": elkSide },
    }));
  return [
    ...side([...(ports?.inlets.keys() ?? [])], 0, "WEST"),
    ...side([...(ports?.outlets.keys() ?? [])], nodeWidth, "EAST"),
  ];
}

function toPartition(group: string | undefined): string {
  return String(group === undefined ? groupOrder.length : groupOrder.indexOf(group));
}

/** Finds the connections on a port shared by many others, such as a supply grid; they do not shape the layout. */
export function toFanConnections(connections: SpecConnection[]): Set<number> {
  const uses = new Map<string, number>();
  for (const { source, target } of connections) {
    uses.set(source, (uses.get(source) ?? 0) + 1);
    uses.set(target, (uses.get(target) ?? 0) + 1);
  }
  const isFan = (port: string) => (uses.get(port) ?? 0) >= fanSize;
  return new Set(
    connections.flatMap(({ source, target }, index) =>
      isFan(source) || isFan(target) ? [index] : [],
    ),
  );
}

function toElkEdges(
  connections: SpecConnection[],
  ports: Map<string, PortKinds>,
  ids: Set<string>,
): ElkExtendedEdge[] {
  const fans = toFanConnections(connections);
  return connections.flatMap((connection, index) => {
    const source = splitPort(connection.source);
    const target = splitPort(connection.target);
    if (!ids.has(source.module) || !ids.has(target.module) || source.module === target.module) {
      return [];
    }
    if (fans.has(index)) return [];
    const hasPorts =
      ports.get(source.module)?.outlets.has(source.port) === true &&
      ports.get(target.module)?.inlets.has(target.port) === true;
    return [
      {
        id: `c${String(index)}`,
        sources: [hasPorts ? connection.source : source.module],
        targets: [hasPorts ? connection.target : target.module],
      },
    ];
  });
}

/** Builds the ELK graph: fixed ports on each node, and groups as ordered partitions read left to right. */
export function toElkGraph(
  modules: SpecModule[],
  connections: SpecConnection[],
  ports: Map<string, PortKinds>,
  groups: Map<string, string>,
): ElkNode {
  const ids = new Set(modules.map((module) => module.id));
  return {
    id: "plant",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.partitioning.activate": "true",
      "elk.separateConnectedComponents": "false",
      "elk.layered.cycleBreaking.strategy": "DEPTH_FIRST",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "48",
      "elk.spacing.edgeNode": "24",
      "elk.spacing.edgeEdge": "10",
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
      "elk.layered.spacing.edgeNodeBetweenLayers": "24",
    },
    children: modules.map((module) => ({
      id: module.id,
      ...toNodeSize(ports.get(module.id)),
      ports: toElkPorts(module.id, ports.get(module.id)),
      layoutOptions: {
        "elk.portConstraints": "FIXED_POS",
        "elk.partitioning.partition": toPartition(groups.get(module.id)),
      },
    })),
    edges: toElkEdges(connections, ports, ids),
  };
}

/** Places modules left to right with ELK's layered algorithm; returns a position for every module. */
export async function toAutoLayout(
  modules: SpecModule[],
  connections: SpecConnection[],
  ports: Map<string, PortKinds>,
  groups: Map<string, string>,
): Promise<Layout> {
  elk ??= createElk();
  const graph = await (await elk).layout(toElkGraph(modules, connections, ports, groups));
  return Object.fromEntries(
    (graph.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]),
  );
}
