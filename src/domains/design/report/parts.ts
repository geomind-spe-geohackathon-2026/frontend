import type { ReportPart } from "@/shared/api/types";

export const reportParts: { part: ReportPart; label: string }[] = [
  { part: "capacities", label: "Capacities" },
  { part: "design", label: "Design" },
  { part: "checks", label: "Constraint checks" },
  { part: "costs", label: "Costs and sources" },
  { part: "agentlog", label: "Agent log and tokens" },
];

/** Keeps the chosen parts in the report's own order, so the same choice always gives the same request. */
export function toOrderedParts(chosen: ReportPart[]): ReportPart[] {
  return reportParts.map((entry) => entry.part).filter((part) => chosen.includes(part));
}
