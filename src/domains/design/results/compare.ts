import type { Kpi, Result } from "@/shared/api/types";

/** Lists the figures that every given result has with a value, in the order of the first result. */
export function toSharedKpis(results: Result[]): Kpi[] {
  const [first, ...rest] = results;
  if (first === undefined) return [];
  return first.kpis.filter(
    (kpi) =>
      kpi.value !== null &&
      rest.every((other) =>
        other.kpis.some((entry) => entry.name === kpi.name && entry.value !== null),
      ),
  );
}

/** Finds the value and unit of a named KPI in a result. */
export function findKpi(result: Result, name: string): Kpi | null {
  return result.kpis.find((kpi) => kpi.name === name) ?? null;
}
