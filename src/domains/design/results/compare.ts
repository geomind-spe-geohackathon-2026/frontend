import { isInfeasible } from "@/shared/api/results";
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

export type ComparedPoint = { id: string; label: string; x: number; y: number };

/** Joins designs that sit on the same point into one label, so no labels overprint. */
export function toMergedPoints(points: ComparedPoint[]): ComparedPoint[] {
  const merged = new Map<string, { first: ComparedPoint; count: number }>();
  for (const point of points) {
    const key = `${point.x.toPrecision(6)}:${point.y.toPrecision(6)}`;
    const found = merged.get(key);
    merged.set(key, { first: found?.first ?? point, count: (found?.count ?? 0) + 1 });
  }
  return [...merged.values()].map(({ first, count }) => ({
    ...first,
    label: count === 1 ? first.label : `${first.label} (+${String(count - 1)})`,
  }));
}

/** Finds the design with the lowest figure among those with no failed check. */
export function toBestId(items: Result[], name: string): string | null {
  const ranked = items.flatMap((item) => {
    const value = findKpi(item, name)?.value ?? null;
    return value === null || isInfeasible(item) || item.checks.failed > 0
      ? []
      : [{ id: item.id, value }];
  });
  return ranked.sort((first, second) => first.value - second.value)[0]?.id ?? null;
}

/** Says how a design's checks went: all passed only when every check was assessed and passed. */
export function toChecksText(result: Result): string {
  const { checks } = result;
  if (isInfeasible(result)) return "infeasible: does not serve every demand";
  if (checks.failed > 0) return `${String(checks.failed)} failed`;
  if (checks.not_assessed > 0) return `${String(checks.not_assessed)} not assessed`;
  return "all passed";
}
