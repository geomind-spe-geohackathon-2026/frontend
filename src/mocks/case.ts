import { http, HttpResponse, type RequestHandler } from "msw";
import type { Page } from "@/shared/api/pagination";
import type {
  Case,
  CaseCheck,
  CaseCreate,
  CaseProblems,
  Series,
  SeriesList,
  Version,
} from "@/shared/api/types";
import type { JsonSchema } from "@/shared/forms/json-schema";
import { findMissing } from "@/shared/forms/missing";
import { validateDocument } from "@/shared/forms/resolver";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

type CaseContent = Case["content"];

const quantity = (units: string[]): JsonSchema => ({
  type: "object",
  required: ["value", "unit"],
  properties: { value: { type: "number" }, unit: { enum: units } },
});

const seriesReference: JsonSchema = {
  type: "object",
  required: ["file", "column", "unit"],
  properties: { file: { type: "string" }, column: { type: "string" }, unit: { type: "string" } },
};

const exampleSchema: JsonSchema = {
  type: "object",
  required: ["format", "kind", "name"],
  properties: {
    format: { const: 1 },
    kind: { const: "case" },
    name: { type: "string" },
    about: { type: "object" },
    demand: {
      type: "object",
      required: ["heating"],
      properties: {
        heating: {
          type: "object",
          required: ["power", "supply_temperature"],
          properties: {
            power: { anyOf: [quantity(["MW", "kW"]), seriesReference] },
            supply_temperature: quantity(["degC", "K"]),
          },
        },
      },
    },
    site: {
      type: "object",
      properties: {
        ground: {
          type: "object",
          properties: {
            surface_temperature: quantity(["degC", "K"]),
            gradient: quantity(["K/km", "K/m"]),
          },
        },
      },
    },
    economics: {
      type: "object",
      required: ["gas_price", "discount_rate"],
      properties: {
        gas_price: quantity(["EUR/MWh"]),
        discount_rate: quantity(["%"]),
        lifetime: quantity(["a"]),
      },
    },
    requirements: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, max: { type: "number", unit: "K" } },
      },
    },
  },
};

const exampleContent: CaseContent = {
  format: 1,
  kind: "case",
  name: "Example problem",
  demand: {
    heating: {
      power: { unit: "MW", file: "example-demand.csv", column: "heating" },
      supply_temperature: { value: 90, unit: "degC" },
    },
  },
  site: { ground: { gradient: { value: 30, unit: "K/km" } } },
  economics: { lifetime: { value: 25, unit: "a" } },
};

type Stored = { version: Version; content: CaseContent; files: Case["files"] };

function toCase(project: string, stored: Stored): Case {
  const missing = findMissing(exampleSchema, stored.content).map((path) => ({
    path,
    message: `${path} is missing`,
  }));
  const problems = validateDocument(exampleSchema, stored.content).map((problem) => ({
    ...problem,
    code: problem.code ?? "invalid_value",
  }));
  return {
    project,
    version: stored.version.number,
    content: stored.content,
    files: stored.files,
    missing,
    problems,
  };
}

function toSeries(): Series[] {
  const points = Array.from({ length: 365 }, (_, day): [string, number] => {
    const time = new Date(Date.UTC(2000, 0, 1 + day)).toISOString();
    return [time, Math.round(20 + 10 * Math.cos((day / 365) * 2 * Math.PI))];
  });
  return [{ name: "demand.heating.power", unit: "MW", points }];
}

function conflict(latest: number | null) {
  return HttpResponse.json(
    {
      error: {
        code: "conflict",
        message: "The problem has a newer version",
        details: latest === null ? {} : { latest },
      },
    },
    { status: 409 },
  );
}

function textOf(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

type Store = Map<string, Stored[]>;

function createStore(): Store {
  return new Map<string, Stored[]>([
    [
      "example-project-1",
      [
        {
          version: {
            number: 1,
            note: "Example first version",
            author: { id: "example-user-admin", name: "Example Admin" },
            created: "2026-01-10T09:00:00Z",
          },
          content: exampleContent,
          files: [{ name: "example-demand.csv", size: 13776 }],
        },
      ],
    ],
  ]);
}

function readHandlers(stored: Store): RequestHandler[] {
  const latest = (project: string) => stored.get(project)?.at(-1);
  return [
    http.get(toRoute("/design/case/schema"), () => HttpResponse.json<JsonSchema>(exampleSchema)),
    http.get(toRoute("/design/case/series"), () =>
      HttpResponse.json<SeriesList>({ series: toSeries() }),
    ),
    http.get(toRoute("/design/case/versions"), ({ request }) => {
      const project = new URL(request.url).searchParams.get("project") ?? "";
      const versions = (stored.get(project) ?? []).map((item) => item.version).reverse();
      return HttpResponse.json<Page<Version>>({ items: versions, next: null });
    }),
    http.post<NoParams, CaseCheck>(toRoute("/design/case/validate"), async ({ request }) => {
      const { content } = await request.json();
      const view = toCase("", { version: emptyVersion, content, files: [] });
      return HttpResponse.json<CaseProblems>({ missing: view.missing, problems: view.problems });
    }),
    http.get(toRoute("/design/case"), ({ request }) => {
      const project = new URL(request.url).searchParams.get("project") ?? "";
      const current = latest(project);
      if (current === undefined) return toErrorResponse(404, "case_not_found", "No problem yet");
      return HttpResponse.json<Case>(toCase(project, current));
    }),
  ];
}

function writeHandlers(stored: Store): RequestHandler[] {
  const latest = (project: string) => stored.get(project)?.at(-1);
  return [
    http.post<NoParams, CaseCreate>(toRoute("/design/case"), async ({ request }) => {
      const body = await request.json();
      const current = latest(body.project);
      if ((current?.version.number ?? null) !== body.base) {
        return conflict(current?.version.number ?? 0);
      }
      const next: Stored = {
        version: {
          number: (current?.version.number ?? 0) + 1,
          note: body.note,
          author: { id: "example-user-admin", name: "Example Admin" },
          created: new Date().toISOString(),
        },
        content: body.content,
        files: current?.files ?? [],
      };
      stored.set(body.project, [...(stored.get(body.project) ?? []), next]);
      return HttpResponse.json<Case>(toCase(body.project, next), { status: 201 });
    }),
    http.post(toRoute("/design/case/files"), async ({ request }) => {
      const form = await request.formData();
      const project = textOf(form.get("project"));
      const current = latest(project);
      if (current === undefined) return toErrorResponse(404, "case_not_found", "No problem yet");
      const name = textOf(form.get("name"));
      const file = form.get("file");
      const size = file instanceof Blob ? file.size : 0;
      const next: Stored = {
        ...current,
        version: {
          ...current.version,
          number: current.version.number + 1,
          note: `Uploaded ${name}`,
        },
        files: [...current.files.filter((item) => item.name !== name), { name, size }],
      };
      stored.set(project, [...(stored.get(project) ?? []), next]);
      return HttpResponse.json<Case>(toCase(project, next), { status: 201 });
    }),
  ];
}

/** In-memory example problems: schema, read, validate, save with conflicts, files, series and versions. */
export function caseHandlers(): RequestHandler[] {
  const stored = createStore();
  return [...readHandlers(stored), ...writeHandlers(stored)];
}

const emptyVersion: Version = {
  number: 0,
  note: "",
  author: { id: "", name: "" },
  created: "1970-01-01T00:00:00Z",
};
