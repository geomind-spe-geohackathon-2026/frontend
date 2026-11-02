import type { Kpi, ResultSummary } from "@/shared/api/design";

/** Lists the KPI names that every given result has, in the order of the first result. */
export function toSharedKpis(results: ResultSummary[]): Kpi[] {
  const [first, ...rest] = results;
  if (first === undefined) return [];
  return first.kpis.filter((kpi) =>
    rest.every((other) => other.kpis.some((entry) => entry.name === kpi.name)),
  );
}

/** Finds the value and unit of a named KPI in a result. */
export function findKpi(result: ResultSummary, name: string): Kpi | null {
  return result.kpis.find((kpi) => kpi.name === name) ?? null;
}
