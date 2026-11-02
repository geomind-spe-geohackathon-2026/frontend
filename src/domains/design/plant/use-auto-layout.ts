import { useEffect, useMemo } from "react";
import { toAutoLayout } from "./auto-layout";
import { readConnections, readModules } from "./spec";
import type { Layout, PlantSpec } from "./types";

/** Places modules that have no position with ELK and reports only the new positions; onPlaced must be stable. */
export function useAutoLayout(
  spec: PlantSpec,
  layout: Layout,
  onPlaced: (placed: Layout) => void,
): void {
  const modules = useMemo(() => readModules(spec), [spec]);
  const connections = useMemo(() => readConnections(spec), [spec]);
  const key = modules
    .filter((module) => layout[module.id] === undefined)
    .map((module) => module.id)
    .join(",");
  useEffect(() => {
    if (key === "") return;
    let cancelled = false;
    const wanted = key.split(",");
    void toAutoLayout(modules, connections).then((placed) => {
      if (cancelled) return;
      onPlaced(Object.fromEntries(Object.entries(placed).filter(([id]) => wanted.includes(id))));
    });
    return () => {
      cancelled = true;
    };
  }, [key, modules, connections, onPlaced]);
}
