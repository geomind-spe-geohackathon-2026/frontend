import type { Result, Study } from "@/shared/api/types";

type Goal = { objective: string; sense: "min" | "max" };

function toGoal(study: Study | undefined): Goal | null {
  if (study === undefined) return null;
  const objective = study.settings.objective;
  if (typeof objective !== "string") return null;
  if (study.kind === "minimize") return { objective, sense: "min" };
  if (study.kind === "maximize") return { objective, sense: "max" };
  return null;
}

function isFeasible(result: Result): boolean {
  return result.checks.failed === 0 && result.checks.not_assessed === 0 && result.checks.passed > 0;
}

function toNewest(results: Result[]): Result | undefined {
  return results.reduce<Result | undefined>(
    (best, item) => (best === undefined || item.created > best.created ? item : best),
    undefined,
  );
}

function kpiOf(result: Result, name: string): number | null {
  return result.kpis.find((kpi) => kpi.name === name)?.value ?? null;
}

/** Picks the result a report opens on: among feasible design results (every check passed) the best on the objective of the newest optimisation study, else the newest feasible one, else the newest result. */
export function toDefaultResult(results: Result[], studies: Study[]): Result | undefined {
  const designs = results.filter((result) => result.role === "design");
  const feasible = designs.filter(isFeasible);
  if (feasible.length === 0) return toNewest(designs.length === 0 ? results : designs);
  const byId = new Map(studies.map((study) => [study.id, study]));
  const goals = feasible
    .map((result) => ({ result, goal: toGoal(byId.get(result.study ?? "")) }))
    .filter((entry) => entry.goal !== null);
  const latest = toNewest(goals.map((entry) => entry.result));
  const goal = goals.find((entry) => entry.result === latest)?.goal ?? null;
  if (goal === null) return toNewest(feasible);
  const scored = feasible.filter((result) => kpiOf(result, goal.objective) !== null);
  const better = (a: Result, b: Result) => {
    const x = kpiOf(a, goal.objective) ?? 0;
    const y = kpiOf(b, goal.objective) ?? 0;
    if (x === y) return a.created > b.created;
    return goal.sense === "min" ? x < y : x > y;
  };
  const best = scored.reduce<Result | undefined>(
    (current, item) => (current === undefined || better(item, current) ? item : current),
    undefined,
  );
  return best ?? toNewest(feasible);
}

/** Picks the run whose agent log a report shows: the run that started the result's study, if an agent started it. */
export function toDefaultRun(result: Result | undefined, studies: Study[]): string {
  if (result === undefined || result.study === null) return "";
  return studies.find((study) => study.id === result.study)?.started_by.run ?? "";
}
