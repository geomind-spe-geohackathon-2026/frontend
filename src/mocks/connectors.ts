import { http, HttpResponse, type RequestHandler } from "msw";
import type { Connector, ConnectorCreate, ConnectorUpdate } from "@/shared/api/pending";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

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

/** Connectors, routes the generated schema does not have yet (see shared/api/pending.ts). */
export function pendingHandlers(): RequestHandler[] {
  return connectorHandlers();
}
