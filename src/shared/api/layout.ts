import { isRecord } from "@/shared/forms/json-schema";

export type Layout = Record<string, { x: number; y: number }>;

/** Converts the layout object of a flowsheet into node positions; entries without numeric x and y are dropped. */
export function fromLayout(layout: Record<string, unknown>): Layout {
  return Object.fromEntries(
    Object.entries(layout).flatMap(([id, at]) =>
      isRecord(at) && typeof at.x === "number" && typeof at.y === "number"
        ? [[id, { x: at.x, y: at.y }]]
        : [],
    ),
  );
}
