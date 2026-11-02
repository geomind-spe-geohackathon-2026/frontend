import type { ReportPart } from "@/shared/api/types";

/** Keeps the chosen parts in the order the backend lists them, so the same choice always gives the same request. */
export function toOrderedParts(order: ReportPart[], chosen: ReportPart[]): ReportPart[] {
  return order.filter((part) => chosen.includes(part));
}
