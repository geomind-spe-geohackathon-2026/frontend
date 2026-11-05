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

/** One tool call of an agent session. */
export type AgentToolCall = {
  call_id: string;
  tool: string;
  error: string | null;
  duration: number | null;
};

/** What one agent session used: its own context (latest call, not summed), tokens, cost and tool calls. */
export type AgentSession = {
  session: string;
  parent_session: string | null;
  agent: string;
  model: string | null;
  status: "running" | "finished" | "failed" | null;
  steps: number;
  llm_calls: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  context_used: number | null;
  context_window: number | null;
  context_left: number | null;
  tool_calls: AgentToolCall[];
};

/** A run's totals and one row per agent session, in start order. */
export type RunAgents = {
  run: {
    id: string;
    status: string;
    input_tokens: number;
    output_tokens: number;
    cost: number;
    llm_calls: number;
    tool_calls: number;
  };
  agents: AgentSession[];
};

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
export type AutoApprove = { auto_approve: boolean };

export type RunCall = {
  call_id: string;
  tool: string;
  agent: string;
  status: "ok" | "error";
  source: unknown;
  input: unknown;
  output: unknown;
};

export type PendingPaths = {
  "/assistant/runs/{run_id}/calls/{call_id}": Omit<Route, "get"> & {
    get: Read<RunCall, never, { run_id: string; call_id: string }>;
  };
  "/assistant/chat/{chat_id}/auto-approve": Omit<Route, "get" | "put"> & {
    get: Read<AutoApprove, never, { chat_id: string }>;
    put: Write<AutoApprove, AutoApprove, { chat_id: string }>;
  };
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
  "/assistant/runs/{run_id}/agents": Omit<Route, "get"> & {
    get: Read<RunAgents, never, { run_id: string }>;
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
