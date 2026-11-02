import { http, HttpResponse, type RequestHandler } from "msw";
import type { Project, ProjectList, ProgressStep } from "@/shared/api/types";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

const step = (state: ProgressStep["state"], label: string): ProgressStep => ({ state, label });

const exampleProjects: Project[] = [
  {
    id: "example-project-1",
    name: "Example district plant",
    owner: { id: "example-user-admin", name: "Example Admin" },
    plant_version: 3,
    case_version: 2,
    created: "2026-01-10T09:00:00Z",
    updated: "2026-01-12T14:30:00Z",
    progress: {
      case: step("done", "complete"),
      plant: step("done", "valid"),
      study: step("running", "1 running"),
      results: step("empty", "none yet"),
      report: step("empty", "none yet"),
    },
  },
  {
    id: "example-project-2",
    name: "Example campus plant",
    owner: { id: "example-user-member", name: "Example Member" },
    plant_version: null,
    case_version: 1,
    created: "2026-01-05T09:00:00Z",
    updated: "2026-01-06T10:00:00Z",
    progress: {
      case: step("incomplete", "2 missing"),
      plant: step("empty", "none yet"),
      study: step("empty", "none yet"),
      results: step("empty", "none yet"),
      report: step("empty", "none yet"),
    },
  },
];

/** In-memory example projects: list, create and read; a new project lives until the page reloads. */
export function workspaceHandlers(): RequestHandler[] {
  const projects = [...exampleProjects];
  return [
    http.get(toRoute("/workspace/projects"), ({ request }) => {
      const search = new URL(request.url).searchParams.get("search")?.toLowerCase() ?? "";
      const items = projects.filter((project) => project.name.toLowerCase().includes(search));
      return HttpResponse.json<ProjectList>({ items, next: null });
    }),
    http.post<NoParams, { name: string }>(toRoute("/workspace/projects"), async ({ request }) => {
      const body = await request.json();
      const now = new Date().toISOString();
      const project: Project = {
        id: `example-project-${String(projects.length + 1)}`,
        name: body.name,
        owner: { id: "example-user-admin", name: "Example Admin" },
        plant_version: null,
        case_version: null,
        created: now,
        updated: now,
        progress: {
          case: step("empty", "none yet"),
          plant: step("empty", "none yet"),
          study: step("empty", "none yet"),
          results: step("empty", "none yet"),
          report: step("empty", "none yet"),
        },
      };
      projects.unshift(project);
      return HttpResponse.json<Project>(project, { status: 201 });
    }),
    http.get(toRoute("/workspace/projects/:projectId"), ({ params }) => {
      const project = projects.find((item) => item.id === params.projectId);
      if (project === undefined) {
        return toErrorResponse(404, "project_not_found", "Project not found");
      }
      return HttpResponse.json<Project>(project);
    }),
  ];
}
