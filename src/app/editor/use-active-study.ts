import { useInfiniteQuery } from "@tanstack/react-query";
import { hasActiveStudy, studiesQuery } from "@/domains/design/study/api";
import { toItems } from "@/shared/api/pagination";

/** Whether a study of the project is queued or running; shares the toolbar's studies query. */
export function useActiveStudy(projectId: string): boolean {
  const studies = useInfiniteQuery(studiesQuery(projectId));
  return hasActiveStudy(toItems(studies.data?.pages));
}
