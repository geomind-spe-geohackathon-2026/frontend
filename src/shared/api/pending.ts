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

/** Routes the backend has not published yet (Connectors), typed by hand like openapi-typescript and merged into `paths` by the client; delete each once `schema.d.ts` has it. */
export type PendingPaths = {
  "/workspace/connectors": Omit<Route, "get" | "post"> & {
    get: Read<Connector[], never>;
    post: Write<Connector, ConnectorCreate>;
  };
  "/workspace/connectors/{connector_id}": Omit<Route, "patch" | "delete"> & {
    patch: Write<Connector, ConnectorUpdate, ConnectorPath>;
    delete: Remove<ConnectorPath>;
  };
  "/workspace/connectors/{connector_id}/check": Omit<Route, "post"> & {
    post: Act<Connector, ConnectorPath>;
  };
};
