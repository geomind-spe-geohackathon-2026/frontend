import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { projectQuery } from "@/shared/api/projects";
import { resultsQuery, toStaleness } from "@/shared/api/results";
import type { Project } from "@/shared/api/types";

type Versions = Pick<Project, "case_version" | "plant_version">;
type Made = { case_version: number | null; plant_version: number | null };
type Dated = Made & { created: string };

/** The newest of a project's results by creation time. */
export function toNewest<T extends Dated>(results: readonly T[] | undefined): T | undefined {
  return [...(results ?? [])].sort((a, b) => b.created.localeCompare(a.created))[0];
}

/** Why a result is out of date (its case is older than the project's), or null when its case is current. */
export function toCaseText(project: Versions, made: Made): string | null {
  if (!toStaleness(project, made).caseChanged) return null;
  return `Out of date: the case changed (version ${String(made.case_version)}, now ${String(project.case_version)}) after this result was made. Run the study again to update it.`;
}

/** A note that a newer plant version exists, which may be another plant, or null when there is none. */
export function toPlantNote(project: Versions, made: Made): string | null {
  if (!toStaleness(project, made).newerPlant) return null;
  return `A newer plant version exists (v${String(project.plant_version)}); this result is for plant version ${String(made.plant_version)}.`;
}

/** The reason a step is out of date, the same words as the step's tooltip, or null when the newest result's case is current. */
export function toOutOfDateText(
  project: Versions,
  results: readonly Dated[] | undefined,
): string | null {
  const latest = toNewest(results);
  if (latest === undefined || !toStaleness(project, latest).caseChanged) return null;
  return `Out of date: the case changed (version ${String(latest.case_version)}, now ${String(project.case_version)}) after the newest result was made. Run the study again to update it.`;
}

/** Under a page header: a warning when the newest result ran on an older case (with an optional action), and a plain note when a newer plant version exists. */
export function OutOfDateAlert({ projectId, action }: { projectId: string; action?: ReactNode }) {
  const project = useQuery(projectQuery(projectId));
  const results = useQuery(resultsQuery(projectId));
  const latest = toNewest(results.data);
  if (project.data === undefined || latest === undefined) return null;
  const text = toOutOfDateText(project.data, results.data);
  const note = toPlantNote(project.data, latest);
  return (
    <>
      {text === null ? null : (
        <Alert className="mb-3.5 border-warn bg-warn-soft">
          <TriangleAlert aria-hidden="true" className="text-warn" />
          <AlertDescription>
            <p>{text}</p>
            {action === undefined ? null : <div className="mt-1.5">{action}</div>}
          </AlertDescription>
        </Alert>
      )}
      {note === null ? null : <p className="mb-3.5 text-[12.5px] text-muted">{note}</p>}
    </>
  );
}
