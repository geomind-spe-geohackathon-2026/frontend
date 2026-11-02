import { useEffect, useState } from "react";
import {
  toFlowsheetSvg,
  toFullFlowsheetSvg,
  type SheetConnection,
  type SheetModule,
} from "@/shared/plant/flowsheet-svg";
import type { Report } from "@/shared/api/types";

function toModules(rows: Report["flowsheet"]["modules"] | undefined): SheetModule[] {
  return (rows ?? []).map((row) => ({
    id: String(row.id),
    type: String(row.type),
    category: String(row.category),
  }));
}

function toConnections(rows: Report["flowsheet"]["connections"] | undefined): SheetConnection[] {
  return (rows ?? []).map((row) => ({
    source: String(row.source),
    target: String(row.target),
    stream: typeof row.stream === "string" ? row.stream : null,
  }));
}

export type FlowsheetPictures = { process: string; full: string };

/** Draws the process diagram and the full flowsheet of a report; null until they are ready. */
export function useFlowsheetSvg(flowsheet: Report["flowsheet"] | undefined) {
  const [pictures, setPictures] = useState<FlowsheetPictures | null>(null);
  useEffect(() => {
    const modules = toModules(flowsheet?.modules);
    if (modules.length === 0) return undefined;
    let active = true;
    const connections = toConnections(flowsheet?.connections);
    void Promise.all([
      toFlowsheetSvg(modules, connections),
      toFullFlowsheetSvg(modules, connections),
    ]).then(([process, full]) => {
      if (active) setPictures({ process, full });
    });
    return () => {
      active = false;
    };
  }, [flowsheet]);
  return pictures;
}
