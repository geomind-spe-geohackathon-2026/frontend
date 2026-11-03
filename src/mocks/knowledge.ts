import { http, HttpResponse, type RequestHandler } from "msw";
import type {
  Connector,
  ConnectorCreate,
  ConnectorUpdate,
  ExperienceEntry,
  KnowledgeCreate,
  KnowledgeEntry,
} from "@/shared/api/pending";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

const exampleKnowledge: KnowledgeEntry[] = [
  {
    id: "example-knowledge-1",
    item: "Example drilling cost",
    value: 1200,
    unit: "EUR/m",
    title: "Example cost report",
    publisher: "Example Publisher",
    year: 2024,
    page: "12",
    link: null,
    price_year: 2024,
    currency: "EUR",
    status: "verified",
    note: null,
    section: "knowledge",
    project: null,
    created: "2026-01-10T09:00:00Z",
    updated: "2026-01-10T09:00:00Z",
    created_by: { kind: "seed", id: null },
  },
  {
    id: "example-knowledge-2",
    item: "Example heat pump cost",
    value: 600,
    unit: "EUR/kW",
    title: "Example catalogue",
    publisher: "Example Institute",
    year: 2023,
    page: null,
    link: "https://example.com/catalogue",
    price_year: 2023,
    currency: "EUR",
    status: "placeholder",
    note: "Example placeholder from the seeded catalogue",
    section: "knowledge",
    project: null,
    created: "2026-01-10T09:00:00Z",
    updated: "2026-01-10T09:00:00Z",
    created_by: { kind: "seed", id: null },
  },
];

const exampleExperience: ExperienceEntry[] = [
  {
    id: "example-doublet-heat-pump",
    section: "experience",
    project: null,
    created: "2026-01-11T10:00:00Z",
    updated: "2026-01-11T10:00:00Z",
    created_by: { kind: "agent", id: "run-1" },
    run: "run-1",
    verdict: "passed",
    features: { heating_peak: 5_000_000, depth: 2000 },
    kpis: { lcoh: 42 },
  },
];

const exampleConnectors: Connector[] = [
  {
    id: "example-connector-1",
    name: "example-weather",
    url: "https://example.com/mcp",
    transport: "http",
    auth: "bearer",
    header_name: null,
    has_secret: true,
    enabled: true,
    status: "ok",
    error: null,
    checked: "2026-01-12T09:00:00Z",
    tools: [
      {
        name: "hourly_temperature",
        description: "Example hourly air temperature",
        read_only: true,
      },
    ],
  },
];

function matches(entry: KnowledgeEntry | ExperienceEntry, q: string): boolean {
  return JSON.stringify(entry).toLowerCase().includes(q.toLowerCase());
}

function knowledgeHandlers(): RequestHandler[] {
  let knowledge = structuredClone(exampleKnowledge);
  let experience = structuredClone(exampleExperience);
  return [
    http.get(toRoute("/workspace/knowledge"), ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get("q") ?? "";
      const list = url.searchParams.get("section") === "experience" ? experience : knowledge;
      return HttpResponse.json({ items: list.filter((entry) => matches(entry, q)), next: null });
    }),
    http.post<NoParams, KnowledgeCreate>(toRoute("/workspace/knowledge"), async ({ request }) => {
      const body = await request.json();
      if (body.link === null && body.page === null) {
        return toErrorResponse(422, "validation_error", "A source needs a page or a link");
      }
      const now = new Date().toISOString();
      const { project, ...fields } = body;
      const entry: KnowledgeEntry = {
        ...fields,
        section: "knowledge",
        project: project ?? null,
        created: now,
        updated: now,
        created_by: { kind: "user", id: "example-user-admin" },
      };
      knowledge = [entry, ...knowledge];
      return HttpResponse.json(entry);
    }),
    http.get(toRoute("/workspace/knowledge/settings"), () =>
      HttpResponse.json({
        sections: ["knowledge", "experience"],
        similarity: 0.8,
        available: true,
      }),
    ),
    http.post(toRoute("/workspace/knowledge/import"), () =>
      HttpResponse.json({ added: 3, replaced: 1, errors: [] }),
    ),
    http.delete<{ section: string; entry_id: string }>(
      toRoute("/workspace/knowledge/:section/:entry_id"),
      ({ params }) => {
        knowledge = knowledge.filter((entry) => entry.id !== params.entry_id);
        experience = experience.filter((entry) => entry.id !== params.entry_id);
        return new HttpResponse(null, { status: 204 });
      },
    ),
  ];
}

function toConnector(body: ConnectorCreate, id: string): Connector {
  return {
    id,
    name: body.name,
    url: body.url,
    transport: body.transport,
    auth: body.auth,
    header_name: body.header_name ?? null,
    has_secret: body.secret !== undefined && body.secret !== "",
    enabled: true,
    status: "ok",
    error: null,
    checked: new Date().toISOString(),
    tools: [{ name: "example_tool", description: "Example tool", read_only: false }],
  };
}

function connectorHandlers(): RequestHandler[] {
  let connectors = structuredClone(exampleConnectors);
  let next = 100;
  const update = (id: string, change: Partial<Connector>) => {
    connectors = connectors.map((item) => (item.id === id ? { ...item, ...change } : item));
    return connectors.find((item) => item.id === id);
  };
  return [
    http.get(toRoute("/workspace/connectors"), () => HttpResponse.json(connectors)),
    http.post<NoParams, ConnectorCreate>(toRoute("/workspace/connectors"), async ({ request }) => {
      next += 1;
      const connector = toConnector(await request.json(), `example-connector-${String(next)}`);
      connectors = [...connectors, connector];
      return HttpResponse.json(connector);
    }),
    http.patch<{ connector_id: string }, ConnectorUpdate>(
      toRoute("/workspace/connectors/:connector_id"),
      async ({ params, request }) => {
        const { secret, ...change } = await request.json();
        const connector = update(params.connector_id, {
          ...change,
          ...(secret === undefined ? {} : { has_secret: secret !== "" }),
        });
        if (connector === undefined) return toErrorResponse(404, "not_found", "No such connector");
        return HttpResponse.json(connector);
      },
    ),
    http.post<{ connector_id: string }>(
      toRoute("/workspace/connectors/:connector_id/check"),
      ({ params }) => {
        const connector = update(params.connector_id, { checked: new Date().toISOString() });
        if (connector === undefined) return toErrorResponse(404, "not_found", "No such connector");
        return HttpResponse.json(connector);
      },
    ),
    http.delete<{ connector_id: string }>(
      toRoute("/workspace/connectors/:connector_id"),
      ({ params }) => {
        connectors = connectors.filter((item) => item.id !== params.connector_id);
        return new HttpResponse(null, { status: 204 });
      },
    ),
  ];
}

/** Knowledge and Connectors, routes the backend has not published yet (see shared/api/pending.ts). */
export function pendingHandlers(): RequestHandler[] {
  return [...knowledgeHandlers(), ...connectorHandlers()];
}
