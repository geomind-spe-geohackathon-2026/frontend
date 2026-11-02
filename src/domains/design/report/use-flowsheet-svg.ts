import { useEffect, useState } from "react";
import {
  toFlowsheetSvg,
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

/** Draws the flowsheet of a report with the editor's layout; null until it is ready. */
export function useFlowsheetSvg(flowsheet: Report["flowsheet"] | undefined): string | null {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    const modules = toModules(flowsheet?.modules);
    if (modules.length === 0) return undefined;
    let active = true;
    void toFlowsheetSvg(modules, toConnections(flowsheet?.connections)).then((drawn) => {
      if (active) setSvg(drawn);
    });
    return () => {
      active = false;
    };
  }, [flowsheet]);
  return svg;
}
