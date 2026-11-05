import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { projectQuery } from "@/shared/api/projects";
import { isOutOfDate, resultsQuery } from "@/shared/api/results";
import type { Project } from "@/shared/api/types";

type Versions = Pick<Project, "case_version" | "plant_version">;
type Made = { created: string; case_version: number | null; plant_version: number | null };

function toNewest(results: readonly Made[] | undefined): Made | undefined {
  return [...(results ?? [])].sort((a, b) => b.created.localeCompare(a.created))[0];
}

function toChange(what: string, made: number | null, now: number | null): string[] {
  if (made === null || now === null || made >= now) return [];
  return [`the ${what} (version ${String(made)}, now ${String(now)})`];
}

/** The reason a step is out of date, the same words as the step's tooltip, or null when the newest result is current. */
export function toOutOfDateText(
  project: Versions,
  results: readonly Made[] | undefined,
): string | null {
  const latest = toNewest(results);
  if (latest === undefined || !isOutOfDate(project, latest)) return null;
  const changed = [
    ...toChange("case", latest.case_version, project.case_version),
    ...toChange("plant", latest.plant_version, project.plant_version),
  ];
  const what = changed.length === 0 ? "the case or the plant" : changed.join(" and ");
  return `Out of date: ${what} changed after the newest result was made. Run the study again to update it.`;
}

/** An alert under a page header when the project's newest result was made on an older case or plant, with an optional action. */
export function OutOfDateAlert({ projectId, action }: { projectId: string; action?: ReactNode }) {
  const project = useQuery(projectQuery(projectId));
  const results = useQuery(resultsQuery(projectId));
  const text = project.data === undefined ? null : toOutOfDateText(project.data, results.data);
  if (text === null) return null;
  return (
    <Alert className="mb-3.5 border-warn bg-warn-soft">
      <TriangleAlert aria-hidden="true" className="text-warn" />
      <AlertDescription>
        <p>{text}</p>
        {action === undefined ? null : <div className="mt-1.5">{action}</div>}
      </AlertDescription>
    </Alert>
  );
}
