import type { Page } from "./pagination";

export type KnowledgeStatus = "verified" | "secondary" | "placeholder";

/** One cited reference value in the shared memory. */
export type KnowledgeEntry = {
  id: string;
  item: string;
  value: number | string;
  unit: string | null;
  title: string;
  publisher: string;
  year: number;
  page: string | null;
  link: string | null;
  price_year: number | null;
  currency: string | null;
  status: KnowledgeStatus;
  note: string | null;
  created: string;
  created_by: string;
};

export type KnowledgeCreate = Omit<KnowledgeEntry, "id" | "created" | "created_by" | "status"> & {
  status: Exclude<KnowledgeStatus, "placeholder">;
};

/** One past design that passed verification; written by the design loop, read-only here. */
export type ExperienceEntry = {
  id: string;
  created: string;
  run: string | null;
  summary: string;
  verdict: string;
  features: Record<string, number | null>;
  kpis: Record<string, number | null>;
};

export type KnowledgeImport = { added: number; skipped: number; errors: string[] };

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
type Section = "knowledge" | "experience";
type EntryPath = { section: Section; entry_id: string };
type ConnectorPath = { connector_id: string };

/** Routes the backend has not published yet (Knowledge, Connectors), typed by hand like openapi-typescript and merged into `paths` by the client; delete each once `schema.d.ts` has it. */
export type PendingPaths = {
  "/workspace/knowledge": Omit<Route, "get" | "post"> & {
    get: Read<
      Page<KnowledgeEntry | ExperienceEntry>,
      { section: Section; q?: string; cursor?: string }
    >;
    post: Write<KnowledgeEntry, KnowledgeCreate>;
  };
  "/workspace/knowledge/import": Omit<Route, "post"> & {
    post: {
      parameters: NoParams;
      requestBody: { content: { "multipart/form-data": { file: Blob } } };
      responses: { 200: Json<KnowledgeImport> };
    };
  };
  "/workspace/knowledge/{section}/{entry_id}": Omit<Route, "get" | "patch" | "delete"> & {
    get: Read<KnowledgeEntry | ExperienceEntry, never, EntryPath>;
    patch: Write<KnowledgeEntry, Partial<KnowledgeCreate>, EntryPath>;
    delete: Remove<EntryPath>;
  };
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
