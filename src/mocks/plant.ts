import { http, HttpResponse, type RequestHandler } from "msw";
import type { Page } from "@/shared/api/pagination";
import type {
  Flowsheet,
  FlowsheetCreate,
  ModulePorts,
  LayoutUpdate,
  Palette,
  Parameters,
  ParametersUpdate,
  Problem,
  SpecCheck,
  SpecProblems,
  Template,
  Version,
} from "@/shared/api/types";
import { fromLayout, type Layout } from "@/shared/api/layout";
import { isRecord } from "@/shared/forms/json-schema";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

type PlantSpec = Flowsheet["spec"];

function readModules(spec: PlantSpec): { id: string; type: string }[] {
  const modules = isRecord(spec.modules) ? spec.modules : {};
  return Object.entries(modules).flatMap(([id, body]) =>
    isRecord(body) && typeof body.type === "string" ? [{ id, type: body.type }] : [],
  );
}

function readConnections(spec: PlantSpec): { source: string; target: string }[] {
  const list: unknown = spec.connections;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item: unknown) =>
    isRecord(item) && typeof item.source === "string" && typeof item.target === "string"
      ? [{ source: item.source, target: item.target }]
      : [],
  );
}

function moduleOf(reference: string): string {
  return reference.split(".")[0] ?? "";
}

const examplePalette: Palette[] = [
  {
    type: "Doublet",
    title: "Doublet",
    category: "wells",
    summary: "Example production and injection well pair.",
  },
  {
    type: "HeatExchanger",
    title: "HeatExchanger",
    category: "exchangers",
    summary: "Example heat exchanger.",
  },
  { type: "HeatPump", title: "HeatPump", category: "heating", summary: "Example heat pump." },
  {
    type: "HeatingGrid",
    title: "HeatingGrid",
    category: "grids",
    summary: "Example heating consumer.",
  },
  {
    type: "ElectricityGrid",
    title: "ElectricityGrid",
    category: "grids",
    summary: "Example electricity supply.",
  },
];

const examplePorts: ModulePorts[] = [
  {
    type: "Doublet",
    inlets: [{ port: "return_in", kind: "brine" }],
    outlets: [{ port: "supply_out", kind: "brine" }],
  },
  {
    type: "HeatExchanger",
    inlets: [
      { port: "hot_in", kind: "brine" },
      { port: "cold_in", kind: "hot_water" },
    ],
    outlets: [
      { port: "hot_out", kind: "brine" },
      { port: "cold_out", kind: "hot_water" },
    ],
  },
  {
    type: "HeatPump",
    inlets: [
      { port: "source_in", kind: "brine" },
      { port: "power_in", kind: "electricity" },
    ],
    outlets: [{ port: "heat_out", kind: "hot_water" }],
  },
  { type: "HeatingGrid", inlets: [{ port: "supply_in", kind: "hot_water" }], outlets: [] },
  { type: "ElectricityGrid", inlets: [], outlets: [{ port: "power_out", kind: "electricity" }] },
];

const exampleTemplates: Template[] = [
  {
    name: "ExampleHeatingPlant",
    title: "ExampleHeatingPlant",
    description: "Example plant with a doublet and a heat exchanger.",
    purpose: "heating",
    modules: 3,
    categories: ["plants"],
  },
  {
    name: "ExampleHeatingCoolingPlant",
    title: "ExampleHeatingCoolingPlant",
    description: "Example plant with heating and cooling.",
    purpose: "both",
    modules: 5,
    categories: ["plants"],
  },
];

const exampleStructure: PlantSpec = {
  format: 1,
  kind: "plant",
  name: "ExamplePlant",
  modules: {
    doublet: { type: "Doublet" },
    hx: { type: "HeatExchanger" },
    users: { type: "HeatingGrid" },
  },
  connections: [
    { source: "doublet.supply_out", target: "hx.hot_in" },
    { source: "hx.cold_out", target: "users.supply_in" },
  ],
  params: { hx: { duty: { value: 20, unit: "MW" } } },
};

const exampleSpec: PlantSpec = {
  format: 1,
  kind: "plant",
  name: "ExamplePlant",
  type: "ExampleHeatingPlant",
  params: { hx: { duty: { value: 20, unit: "MW" } } },
};

function structureOf(spec: PlantSpec): PlantSpec {
  if (isRecord(spec.modules)) return spec;
  return { ...exampleStructure, params: spec.params };
}

const exampleAuthor = { id: "example-user-admin", name: "Example Admin" };

type Stored = { version: Version; spec: PlantSpec; layout: Layout };

function toKind(spec: PlantSpec, reference: string): string | null {
  const [id, port] = reference.split(".");
  const type = readModules(spec).find((module) => module.id === id)?.type;
  const outlets = examplePorts.find((entry) => entry.type === type)?.outlets;
  return outlets?.find((outlet) => outlet.port === port)?.kind ?? null;
}

function toFlowsheet(project: string, stored: Stored): Flowsheet {
  const structure = structureOf(stored.spec);
  const modules = readModules(structure).map((module) => ({
    ...module,
    title: module.type,
    category: examplePalette.find((item) => item.type === module.type)?.category ?? "",
  }));
  const connections = readConnections(structure).map((connection) => {
    const kind = toKind(structure, connection.source);
    return { ...connection, stream: kind, kind };
  });
  return {
    project,
    version: stored.version.number,
    spec: stored.spec,
    structure,
    layout: stored.layout,
    modules,
    connections,
  };
}

function toProblems(spec: PlantSpec): Problem[] {
  const ids = new Set(readModules(spec).map((module) => module.id));
  const problems: Problem[] = [];
  readConnections(spec).forEach((connection, index) => {
    const ends = [moduleOf(connection.source), moduleOf(connection.target)];
    if (ends.every((id) => ids.has(id))) return;
    problems.push({
      path: `connections.${String(index)}`,
      message: "connects a module that does not exist",
      code: "invalid_connection",
    });
  });
  if (ids.has("hx") && !hasApproach(spec)) {
    problems.push({
      path: "params.hx.approach_temperature",
      message: "hx.approach_temperature: no value",
      code: "missing_value",
    });
  }
  return problems;
}

function hasApproach(spec: PlantSpec): boolean {
  const params = spec.params;
  if (typeof params !== "object" || params === null || !("hx" in params)) return false;
  const hx = params.hx;
  return typeof hx === "object" && hx !== null && "approach_temperature" in hx;
}

function conflict(latest: number) {
  return HttpResponse.json(
    { error: { code: "conflict", message: "The plant has a newer version", details: { latest } } },
    { status: 409 },
  );
}

function toLayout(value: Record<string, unknown> | null | undefined): Layout {
  return fromLayout(value ?? {});
}

function toVersion(number: number, note: string): Version {
  return { number, note, author: exampleAuthor, created: new Date().toISOString() };
}

type Store = Map<string, Stored[]>;

function createStore(): Store {
  const first: Stored = {
    version: {
      number: 1,
      note: "Example first version",
      author: exampleAuthor,
      created: "2026-01-10T09:00:00Z",
    },
    spec: exampleSpec,
    layout: { doublet: { x: 0, y: 0 }, hx: { x: 300, y: 0 }, users: { x: 600, y: 0 } },
  };
  return new Map([["example-project-1", [first]]]);
}

function catalogHandlers(): RequestHandler[] {
  return [
    http.get(toRoute("/plant/flowsheet/palette"), () =>
      HttpResponse.json<Palette[]>(examplePalette),
    ),
    http.get(toRoute("/plant/flowsheet/ports"), () =>
      HttpResponse.json<ModulePorts[]>(examplePorts),
    ),
    http.get(toRoute("/plant/flowsheet/templates"), () =>
      HttpResponse.json<Template[]>(exampleTemplates),
    ),
    http.post<NoParams, SpecCheck>(toRoute("/plant/flowsheet/validate"), async ({ request }) => {
      const { spec } = await request.json();
      return HttpResponse.json<SpecProblems>({ problems: toProblems(spec) });
    }),
  ];
}

function readHandlers(store: Store): RequestHandler[] {
  const latest = (project: string) => store.get(project)?.at(-1);
  return [
    http.get(toRoute("/plant/flowsheet"), ({ request }) => {
      const project = new URL(request.url).searchParams.get("project") ?? "";
      const current = latest(project);
      if (current === undefined) return toErrorResponse(404, "plant_not_found", "No plant yet");
      return HttpResponse.json<Flowsheet>(toFlowsheet(project, current));
    }),
    http.get(toRoute("/plant/flowsheet/versions"), ({ request }) => {
      const project = new URL(request.url).searchParams.get("project") ?? "";
      const versions = (store.get(project) ?? []).map((item) => item.version).reverse();
      return HttpResponse.json<Page<Version>>({ items: versions, next: null });
    }),
    http.get(toRoute("/plant/flowsheet/versions/:number"), ({ request, params }) => {
      const project = new URL(request.url).searchParams.get("project") ?? "";
      const found = store
        .get(project)
        ?.find((item) => String(item.version.number) === params.number);
      if (found === undefined) return toErrorResponse(404, "plant_not_found", "No such version");
      return HttpResponse.json<Flowsheet>(toFlowsheet(project, found));
    }),
    http.get(toRoute("/plant/parameters"), ({ request }) => {
      const query = new URL(request.url).searchParams;
      const current = latest(query.get("project") ?? "");
      const module = readModules(structureOf(current?.spec ?? {})).find(
        (item) => item.id === query.get("module"),
      );
      if (current === undefined || module === undefined)
        return toErrorResponse(404, "module_not_found", "No such module");
      return HttpResponse.json<Parameters>(toParameters(module.id, module.type, current.spec));
    }),
  ];
}

function toValue(leaf: unknown): unknown {
  return isRecord(leaf) && "value" in leaf ? leaf.value : leaf;
}

function toParameters(module: string, type: string, spec: PlantSpec): Parameters {
  const all = isRecord(spec.params) ? spec.params : {};
  const own = all[module];
  const entries = isRecord(own) ? Object.entries(own) : [];
  const values = Object.fromEntries(entries.map(([key, leaf]) => [key, toValue(leaf)]));
  return {
    module,
    type,
    schema: {
      type: "object",
      properties: {
        duty: { type: "number", unit: "MW", minimum: 0 },
        approach_temperature: { type: "number", unit: "K", minimum: 0 },
      },
    },
    values,
    missing: "approach_temperature" in values ? [] : ["approach_temperature"],
    ranges: ["duty"],
    history: [],
  };
}

function writeHandlers(store: Store): RequestHandler[] {
  const latest = (project: string) => store.get(project)?.at(-1);
  return [
    http.post<NoParams, FlowsheetCreate>(toRoute("/plant/flowsheet"), async ({ request }) => {
      const body = await request.json();
      const current = latest(body.project);
      if ((current?.version.number ?? null) !== body.base)
        return conflict(current?.version.number ?? 0);
      const spec = body.spec ?? {
        ...exampleSpec,
        name: body.template ?? "Template",
        type: body.template ?? "Template",
      };
      const next: Stored = {
        version: toVersion((current?.version.number ?? 0) + 1, body.note),
        spec,
        layout: toLayout(body.layout),
      };
      store.set(body.project, [...(store.get(body.project) ?? []), next]);
      return HttpResponse.json<Flowsheet>(toFlowsheet(body.project, next), { status: 201 });
    }),
    http.put<NoParams, LayoutUpdate>(toRoute("/plant/flowsheet/layout"), async ({ request }) => {
      const body = await request.json();
      const current = latest(body.project);
      if (current === undefined) return toErrorResponse(404, "plant_not_found", "No plant yet");
      current.layout = toLayout(body.layout);
      return HttpResponse.json<Flowsheet>(toFlowsheet(body.project, current));
    }),
    http.post<NoParams, ParametersUpdate>(toRoute("/plant/parameters"), async ({ request }) => {
      const body = await request.json();
      const current = latest(body.project);
      if (current === undefined) return toErrorResponse(404, "plant_not_found", "No plant yet");
      if (current.version.number !== body.base) return conflict(current.version.number);
      const leaves = Object.fromEntries(
        Object.entries(body.params).map(([key, value]) => [key, { value }]),
      );
      const params = {
        ...(typeof current.spec.params === "object" ? current.spec.params : {}),
        [body.module]: leaves,
      };
      const next: Stored = {
        ...current,
        version: toVersion(current.version.number + 1, body.note),
        spec: { ...current.spec, params },
      };
      store.set(body.project, [...(store.get(body.project) ?? []), next]);
      return HttpResponse.json<Version>(next.version, { status: 201 });
    }),
  ];
}

/** In-memory example plants: palette, templates, validation, versions with conflicts, layout and parameters. */
export function plantHandlers(): RequestHandler[] {
  const store = createStore();
  return [...catalogHandlers(), ...readHandlers(store), ...writeHandlers(store)];
}
