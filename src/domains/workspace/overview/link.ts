import type { Activity } from "./types";

/** Builds the path of an activity link inside a project: the route, plus the id when the row has one. */
export function toActivityPath(projectId: string, link: NonNullable<Activity["link"]>): string {
  const route = link.route.replace(/^\/+|\/+$/g, "");
  const suffix = link.id === null ? "" : `/${link.id}`;
  return `/projects/${projectId}/${route}${suffix}`;
}
