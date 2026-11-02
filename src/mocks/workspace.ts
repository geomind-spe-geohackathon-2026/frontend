import { http, HttpResponse, type RequestHandler } from "msw";
import type { Page } from "@/shared/api/pagination";
import type { Document, Overview, Project, ProgressStep, ProjectCreate } from "@/shared/api/types";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

const step = (state: ProgressStep["state"], label: string): ProgressStep => ({ state, label });

const exampleOwner = { id: "example-user-admin", name: "Example Admin" };

const emptyProgress: Project["progress"] = {
  case: step("empty", "none yet"),
  plant: step("empty", "none yet"),
  study: step("empty", "none yet"),
  results: step("empty", "none yet"),
  report: step("empty", "none yet"),
};

const noBudget: Project["budget"] = { max_tokens: null, max_cost: null };

const exampleProjects: Project[] = [
  {
    id: "example-project-1",
    name: "Example district plant",
    owner: exampleOwner,
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
    chats: 3,
    runs: 5,
    budget: noBudget,
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
      ...emptyProgress,
      case: step("incomplete", "2 missing"),
    },
    chats: 0,
    runs: 0,
    budget: noBudget,
  },
];

const exampleOverview: Overview = {
  progress: exampleProjects[0]?.progress ?? emptyProgress,
  chats: [
    {
      id: "example-chat-1",
      project: "example-project-1",
      title: "Example design conversation",
      created: "2026-01-12T09:41:00Z",
      last_run: { id: "example-run-1", status: "running" },
    },
    {
      id: "example-chat-2",
      project: "example-project-1",
      title: "Example question about the plant",
      created: "2026-01-11T16:00:00Z",
      last_run: null,
    },
  ],
  activity: [
    {
      id: "example-activity-1",
      time: "2026-01-12T09:44:00Z",
      actor: { kind: "agent", name: "designer" },
      text: "started study Example minimum cost",
      link: { route: "design/study", id: null },
    },
    {
      id: "example-activity-2",
      time: "2026-01-12T09:40:00Z",
      actor: { kind: "user", name: "Example Admin" },
      text: "saved plant v3",
      link: { route: "design/plant", id: null },
    },
  ],
  active_runs: [
    {
      id: "example-run-1",
      chat: "example-chat-1",
      project: "example-project-1",
      status: "running",
      loop: "design",
      started: "2026-01-12T09:41:00Z",
      ended: null,
      usage: { input_tokens: 1200, output_tokens: 300, cost: 0.02 },
      request: null,
      error: null,
    },
  ],
};

const exampleDocuments: Document[] = [
  {
    id: "example-document-1",
    project: "example-project-1",
    name: "example-requirements.pdf",
    size: 159744,
    searchable: "ready",
    created: "2026-01-10T10:00:00Z",
  },
];

function toCopyFailure(body: ProjectCreate, source: Project | undefined) {
  if (body.case_from === undefined || body.case_from === null) return null;
  if (source === undefined) return toErrorResponse(404, "project_not_found", "Project not found");
  if (source.case_version !== null) return null;
  return toErrorResponse(404, "case_not_found", "That project has no problem");
}

function toNewProject(number: number, name: string, source: Project | undefined): Project {
  const now = new Date().toISOString();
  return {
    id: `example-project-${String(number)}`,
    name,
    owner: exampleOwner,
    plant_version: null,
    case_version: source === undefined ? null : 1,
    created: now,
    updated: now,
    progress:
      source === undefined ? emptyProgress : { ...emptyProgress, case: source.progress.case },
    chats: 0,
    runs: 0,
    budget: noBudget,
  };
}

function projectHandlers(projects: Project[]): RequestHandler[] {
  return [
    http.get(toRoute("/workspace/projects"), ({ request }) => {
      const search = new URL(request.url).searchParams.get("search")?.toLowerCase() ?? "";
      const items = projects.filter((project) => project.name.toLowerCase().includes(search));
      return HttpResponse.json<Page<Project>>({ items, next: null });
    }),
    http.post<NoParams, ProjectCreate>(toRoute("/workspace/projects"), async ({ request }) => {
      const body = await request.json();
      const source = projects.find((item) => item.id === body.case_from);
      const failure = toCopyFailure(body, source);
      if (failure !== null) return failure;
      const project = toNewProject(projects.length + 1, body.name, source);
      projects.unshift(project);
      return HttpResponse.json<Project>(project, { status: 201 });
    }),
    http.post(toRoute("/workspace/projects/import"), async ({ request }) => {
      const file = (await request.formData()).get("file");
      if (file === null || typeof file === "string") {
        return toErrorResponse(422, "validation_failed", "The zip file is missing");
      }
      const now = new Date().toISOString();
      const project: Project = {
        id: `example-project-${String(projects.length + 1)}`,
        name: file.name.replace(/\.zip$/, ""),
        owner: exampleOwner,
        plant_version: null,
        case_version: null,
        created: now,
        updated: now,
        progress: emptyProgress,
        chats: 0,
        runs: 0,
        budget: noBudget,
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

function projectChangeHandlers(projects: Project[]): RequestHandler[] {
  return [
    http.patch<{ projectId: string }, { name?: string; budget?: Project["budget"] }>(
      toRoute("/workspace/projects/:projectId"),
      async ({ params, request }) => {
        const project = projects.find((item) => item.id === params.projectId);
        if (project === undefined) {
          return toErrorResponse(404, "project_not_found", "Project not found");
        }
        const { name, budget } = await request.json();
        if (name !== undefined) project.name = name;
        if (budget !== undefined) project.budget = budget;
        return HttpResponse.json<Project>(project);
      },
    ),
    http.delete(toRoute("/workspace/projects/:projectId"), ({ params }) => {
      const index = projects.findIndex((item) => item.id === params.projectId);
      if (index < 0) return toErrorResponse(404, "project_not_found", "Project not found");
      projects.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(toRoute("/workspace/projects/:projectId/export"), () =>
      HttpResponse.arrayBuffer(new TextEncoder().encode("example zip").buffer, {
        headers: { "Content-Type": "application/zip" },
      }),
    ),
  ];
}

function documentHandlers(documents: Document[]): RequestHandler[] {
  return [
    http.get(toRoute("/workspace/documents/formats"), () => HttpResponse.json([".md", ".pdf"])),
    http.get(toRoute("/workspace/documents"), ({ request }) => {
      const project = new URL(request.url).searchParams.get("project");
      const items = documents.filter((document) => document.project === project);
      return HttpResponse.json<Page<Document>>({ items, next: null });
    }),
    http.post(toRoute("/workspace/documents"), async ({ request }) => {
      const form = await request.formData();
      const file = form.get("file");
      const project = form.get("project");
      if (file === null || typeof file === "string" || typeof project !== "string") {
        return toErrorResponse(422, "validation_failed", "A project and a file are required");
      }
      const document: Document = {
        id: `example-document-${String(documents.length + 1)}`,
        project,
        name: file.name,
        size: file.size,
        searchable: "pending",
        created: new Date().toISOString(),
      };
      documents.push(document);
      return HttpResponse.json<Document>(document, { status: 201 });
    }),
    http.delete(toRoute("/workspace/documents/:documentId"), ({ params }) => {
      const index = documents.findIndex((item) => item.id === params.documentId);
      if (index < 0) return toErrorResponse(404, "not_found", "Document not found");
      documents.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

function overviewHandlers(projects: Project[]): RequestHandler[] {
  return [
    http.get(toRoute("/workspace/overview"), ({ request }) => {
      const id = new URL(request.url).searchParams.get("project");
      const project = projects.find((item) => item.id === id);
      if (project === undefined) {
        return toErrorResponse(404, "project_not_found", "Project not found");
      }
      const isExample = project.id === "example-project-1";
      return HttpResponse.json<Overview>({
        progress: project.progress,
        chats: isExample ? exampleOverview.chats : [],
        activity: isExample ? exampleOverview.activity : [],
        active_runs: isExample ? exampleOverview.active_runs : [],
      });
    }),
  ];
}

/** In-memory example projects, overview and documents: list, create, import, rename, delete, export and upload; state lives until the page reloads. */
export function workspaceHandlers(): RequestHandler[] {
  const projects = exampleProjects.map((project) => ({ ...project }));
  return [
    ...projectHandlers(projects),
    ...projectChangeHandlers(projects),
    ...overviewHandlers(projects),
    ...documentHandlers([...exampleDocuments]),
  ];
}
