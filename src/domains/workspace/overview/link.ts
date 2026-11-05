import type { Activity } from "@/shared/api/types";

/** Builds the path of an activity link inside a project: a case or plant version opens History on it, a study its record, other routes take the id as a path part. */
export function toActivityPath(projectId: string, link: NonNullable<Activity["link"]>): string {
  const route = link.route.replace(/^\/+|\/+$/g, "");
  const base = `/projects/${projectId}/${route}`;
  if (link.id === null) return base;
  if (route === "design/case" || route === "design/plant") {
    return `${base}?version=${encodeURIComponent(link.id)}`;
  }
  if (route === "design/study") return `${base}/${link.id}/record`;
  return `${base}/${link.id}`;
}
