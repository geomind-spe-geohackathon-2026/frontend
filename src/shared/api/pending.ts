export type ConnectorTool = { name: string; description: string; read_only: boolean };

/** One MCP server the agents may use; the secret is never sent back. */
export type Connector = {
  id: string;
  name: string;
  url: string;
  transport: "http" | "sse";
  auth: "none" | "bearer" | "header";
  header_name: string | null;
  has_secret: boolean;
  enabled: boolean;
  status: "unchecked" | "ok" | "error";
  error: string | null;
  checked: string | null;
  tools: ConnectorTool[];
  created?: string;
  steps?: CheckStep[] | null;
  server_info?: { name: string | null; version: string | null; protocol: string | null } | null;
  elapsed_ms?: number | null;
};

/** One step of a connector check: reachable, initialize, auth or tools. */
export type CheckStep = {
  name: string;
  status: "ok" | "failed" | "skipped";
  reason: string | null;
};

export type ConnectorCreate = {
  name: string;
  url: string;
  transport: Connector["transport"];
  auth: Connector["auth"];
  header_name?: string;
  secret?: string;
};

export type ConnectorUpdate = Partial<ConnectorCreate & { enabled: boolean }>;

type Json<T> = { content: { "application/json": T } };
type NoParams = { query?: never; header?: never; path?: never; cookie?: never };
type WithPath<P> = { query?: never; header?: never; path: P; cookie?: never };
type Read<R, Q, P = never> = {
  parameters: { query?: Q; header?: never; path?: P; cookie?: never };
  requestBody?: never;
  responses: { 200: Json<R> };
};
type Write<R, B, P = never> = {
  parameters: [P] extends [never] ? NoParams : WithPath<P>;
  requestBody: Json<B>;
  responses: { 200: Json<R> };
};
type Act<R, P> = {
  parameters: WithPath<P>;
  requestBody?: never;
  responses: { 200: Json<R> };
};
type Remove<P> = {
  parameters: WithPath<P>;
  requestBody?: never;
  responses: { 204: { content?: never } };
};
type Route = {
  parameters: { query?: never; header?: never; path?: never; cookie?: never };
  get?: never;
  put?: never;
  post?: never;
  delete?: never;
  options?: never;
  head?: never;
  patch?: never;
  trace?: never;
};
type ConnectorPath = { connector_id: string };

/** One port that fits the dragged port, best first; exact and loose list the matching stream fields. */
export type PortSuggestion = {
  port: string;
  match: "exact" | "loose";
  exact: string[];
  loose: string[];
  closes_loop: boolean;
};

/** Compatible ports for one port of the project's saved plant (gemini 0.6 and later). */
export type PortSuggestions = { port: string; suggestions: PortSuggestion[] };

/** Routes the backend has not published yet (Connectors), typed by hand like openapi-typescript and merged into `paths` by the client; delete each once `schema.d.ts` has it. */
export type PendingPaths = {
  "/workspace/mcp": Omit<Route, "get" | "post"> & {
    get: Read<Connector[], never>;
    post: Write<Connector, ConnectorCreate>;
  };
  "/workspace/mcp/{connector_id}": Omit<Route, "patch" | "delete"> & {
    patch: Write<Connector, ConnectorUpdate, ConnectorPath>;
    delete: Remove<ConnectorPath>;
  };
  "/workspace/mcp/{connector_id}/check": Omit<Route, "post"> & {
    post: Act<Connector, ConnectorPath>;
  };
  "/assistant/suggestions": Omit<Route, "get"> & {
    get: Read<{ suggestions: unknown }, { project: string; chat?: string }>;
  };
  "/plant/flowsheet/suggest": Omit<Route, "get"> & {
    get: Read<PortSuggestions, { project: string; port: string; limit?: number }>;
  };
  "/workspace/rag/{document_id}/file": Omit<Route, "get"> & {
    get: {
      parameters: WithPath<{ document_id: string }>;
      requestBody?: never;
      responses: { 200: { content: { "application/octet-stream": Blob } } };
    };
  };
};
