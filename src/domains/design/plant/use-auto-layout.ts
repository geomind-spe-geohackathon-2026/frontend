import { useEffect, useMemo } from "react";
import { toAutoLayout, toFanConnections } from "./auto-layout";
import { toModuleGroups } from "./groups";
import { readConnections, readModules, toPorts } from "./spec";
import { toConnectionStreams } from "./streams";
import type { Layout } from "@/shared/api/layout";
import type { ModulePorts, Palette } from "@/shared/api/types";
import type { PlantSpec } from "./types";

/** Reads what the layout and the canvas share from a plant document: modules, connections, ports, streams and groups. */
export function usePlantGraph(spec: PlantSpec, catalog: ModulePorts[], palette: Palette[]) {
  return useMemo(() => {
    const modules = readModules(spec);
    const connections = readConnections(spec);
    const ports = toPorts(modules, catalog);
    const streams = toConnectionStreams(connections, ports);
    const groups = toModuleGroups(modules, connections, streams, palette);
    const fans = toFanConnections(connections);
    return { modules, connections, ports, streams, groups, fans };
  }, [spec, catalog, palette]);
}

export type PlantGraph = ReturnType<typeof usePlantGraph>;

/** Places modules that have no position with ELK and reports only the new positions; onPlaced must be stable. */
export function useAutoLayout(
  graph: PlantGraph,
  layout: Layout,
  onPlaced: (placed: Layout) => void,
): void {
  const key = graph.modules
    .filter((module) => layout[module.id] === undefined)
    .map((module) => module.id)
    .join(",");
  useEffect(() => {
    if (key === "") return;
    let cancelled = false;
    const wanted = key.split(",");
    const { modules, connections, ports, groups } = graph;
    void toAutoLayout(modules, connections, ports, groups).then((placed) => {
      if (cancelled) return;
      onPlaced(Object.fromEntries(Object.entries(placed).filter(([id]) => wanted.includes(id))));
    });
    return () => {
      cancelled = true;
    };
  }, [key, graph, onPlaced]);
}
