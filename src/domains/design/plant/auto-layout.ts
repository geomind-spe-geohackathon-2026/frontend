import type { SpecConnection, SpecModule } from "./spec";
import { splitPort } from "./spec";
import type { Layout } from "./types";

export const nodeWidth = 200;
export const nodeHeight = 84;

async function createElk() {
  const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
  return new ELK();
}

let elk: ReturnType<typeof createElk> | null = null;

/** Places modules left to right with ELK's layered algorithm; returns a position for every module. */
export async function toAutoLayout(
  modules: SpecModule[],
  connections: SpecConnection[],
): Promise<Layout> {
  const ids = new Set(modules.map((module) => module.id));
  elk ??= createElk();
  const graph = await (
    await elk
  ).layout({
    id: "plant",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
    },
    children: modules.map((module) => ({ id: module.id, width: nodeWidth, height: nodeHeight })),
    edges: connections.flatMap((connection, index) => {
      const source = splitPort(connection.source).module;
      const target = splitPort(connection.target).module;
      if (!ids.has(source) || !ids.has(target) || source === target) return [];
      return [{ id: `c${String(index)}`, sources: [source], targets: [target] }];
    }),
  });
  return Object.fromEntries(
    (graph.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]),
  );
}
