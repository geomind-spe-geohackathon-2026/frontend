import { http, HttpResponse, type RequestHandler } from "msw";
import type { Page } from "@/shared/api/pagination";
import type { Study, StudyCreate, StudyKind } from "@/shared/api/types";
import type { JsonSchema } from "@/shared/forms/json-schema";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

const exampleSettings: JsonSchema = {
  title: "Example study settings",
  required: ["runs"],
  properties: {
    runs: { type: "integer", title: "Number of runs", unit: "" },
    horizon: { type: "number", title: "Horizon", unit: "a" },
    objective: { type: "string", title: "Objective", enum: ["example-cost", "example-emissions"] },
  },
};

const exampleKinds: StudyKind[] = [
  {
    kind: "size",
    title: "Size",
    use: "method",
    description: "Sizes the plant for the demand.",
    schema: exampleSettings,
  },
  {
    kind: "optimise",
    title: "Optimise",
    use: "method",
    description: "Searches the design space.",
    schema: exampleSettings,
  },
  {
    kind: "sensitivity",
    title: "Sensitivity",
    use: "method",
    description: "Varies one input.",
    schema: { title: "None", properties: {} },
  },
];

function toStudy(project: string, id: string, input: Partial<Study>): Study {
  return {
    id,
    project,
    kind: "size",
    name: "Example study",
    settings: {},
    status: "queued",
    progress: { done: 0, total: 1 },
    started_by: { kind: "user", name: "Example Admin", run: null },
    case_version: 2,
    plant_version: 3,
    result: null,
    error: null,
    missing: [],
    created: "2026-01-12T14:00:00Z",
    ended: null,
    ...input,
  };
}

function toInitial(): Study[] {
  const project = "example-project-1";
  return [
    toStudy(project, "example-study-1", {
      name: "Example size study",
      status: "done",
      progress: { done: 1, total: 1 },
      started_by: { kind: "agent", name: "designer", run: "example-run-1" },
      result: "example-result-1",
      ended: "2026-01-12T14:03:00Z",
    }),
    toStudy(project, "example-study-2", {
      name: "Example optimise study",
      kind: "optimise",
      status: "running",
    }),
    toStudy(project, "example-study-3", {
      name: "Example sensitivity study",
      kind: "sensitivity",
      status: "blocked",
      missing: [{ path: "economics.example_price", message: "no value given" }],
    }),
  ];
}

const pollsToFinish = 2;

/** Example study routes: a running study, a created one too, that ends after two polls, a blocked one, create (running), start and cancel. */
export function studyHandlers(): RequestHandler[] {
  const studies = toInitial();
  const polls = new Map<string, number>();

  function replace(id: string, change: Partial<Study>): Study | null {
    const index = studies.findIndex((study) => study.id === id);
    const current = studies[index];
    if (current === undefined) return null;
    const next = { ...current, ...change };
    studies[index] = next;
    return next;
  }

  function advance(): void {
    for (const study of studies.filter((entry) => entry.status === "running")) {
      const count = (polls.get(study.id) ?? 0) + 1;
      polls.set(study.id, count);
      if (count < pollsToFinish) continue;
      replace(study.id, {
        status: "done",
        progress: { done: 1, total: 1 },
        result: "example-result-2",
        ended: "2026-01-12T14:10:00Z",
      });
    }
  }

  return [
    http.get(toRoute("/design/study/kinds"), () => HttpResponse.json<StudyKind[]>(exampleKinds)),
    http.get(toRoute("/design/study"), () => {
      advance();
      return HttpResponse.json<Page<Study>>({ items: [...studies].reverse(), next: null });
    }),
    http.post<NoParams, StudyCreate>(toRoute("/design/study"), async ({ request }) => {
      const body = await request.json();
      const id = `example-study-${String(studies.length + 1)}`;
      const study = toStudy(body.project, id, {
        kind: body.kind,
        name: body.name,
        settings: body.settings,
        status: "running",
      });
      studies.push(study);
      return HttpResponse.json<Study>(study, { status: 201 });
    }),
    http.post<{ id: string }>(toRoute("/design/study/:id/start"), ({ params }) => {
      const study = replace(params.id, { status: "queued", missing: [] });
      return study === null
        ? toErrorResponse(404, "study_not_found", "No such study")
        : HttpResponse.json<Study>(study);
    }),
    http.post<{ id: string }>(toRoute("/design/study/:id/cancel"), ({ params }) => {
      const study = replace(params.id, { status: "cancelled", ended: "2026-01-12T14:11:00Z" });
      return study === null
        ? toErrorResponse(404, "study_not_found", "No such study")
        : HttpResponse.json<Study>(study);
    }),
  ];
}
