import { queryOptions } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";

type Fields = Record<string, unknown>;

/** Query options for what an agent's study call stored (backend `GET /design/study/{id}/agent-record`). */
export const agentRecordQuery = (studyId: string) =>
  queryOptions({
    queryKey: ["study-agent-record", studyId],
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/design/study/{study_id}/agent-record", {
          params: { path: { study_id: studyId } },
          signal,
        }),
      ),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

/** Reads a value as a record of fields, or null. */
export function asFields(value: unknown): Fields | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Fields) : null;
}

/** Reads a value as a list of records. */
export function asList(value: unknown): Fields[] {
  return Array.isArray(value) ? value.flatMap((item) => (asFields(item) === null ? [] : [item as Fields])) : [];
}

const figure = new Intl.NumberFormat("en", { maximumSignificantDigits: 4 });

/** Writes a value, a number or a {value, unit} pair, for a table cell. */
export function toCell(value: unknown): string {
  if (typeof value === "number") return figure.format(value);
  const fields = asFields(value);
  if (fields !== null && "value" in fields) {
    const shown = typeof fields.value === "number" ? figure.format(fields.value) : String(fields.value);
    const unit = typeof fields.unit === "string" && fields.unit !== "-" ? ` ${fields.unit}` : "";
    return `${shown}${unit}`;
  }
  if (value === null || value === undefined) return "–";
  return typeof value === "string" || typeof value === "boolean" ? String(value) : JSON.stringify(value);
}

/** One short line on what an agent's study found: sizing done, how many runs were feasible, or the best value. */
export function toRecordSummary(tool: string, result: unknown): string {
  const fields = asFields(result);
  if (fields === null) return "Done";
  if (tool === "size_plant" || "sizing" in fields) return "Sizing done";
  if (tool === "run_study" || Array.isArray(fields.runs)) {
    const runs = asList(fields.runs);
    const feasible = runs.filter((run) => run.feasible === true).length;
    return `${String(runs.length)} ${runs.length === 1 ? "run" : "runs"}, ${String(feasible)} feasible`;
  }
  if ("best" in fields) {
    const best = asFields(fields.best);
    const value = best === null ? fields.best : (best.value ?? best.objective ?? best);
    return `Best ${toCell(value)}${fields.feasible === false ? " (infeasible)" : ""}`;
  }
  return "Done";
}
