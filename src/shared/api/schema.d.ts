export interface paths {
  "/identity/authn/login": {
    post: {
      requestBody: { content: { "application/json": components["schemas"]["LoginRequest"] } };
      responses: { 200: { content: { "application/json": components["schemas"]["LoginResponse"] } } };
    };
  };
  "/identity/authn/refresh": {
    post: {
      requestBody: { content: { "application/json": { refresh_token: string } } };
      responses: { 200: { content: { "application/json": components["schemas"]["RefreshResponse"] } } };
    };
  };
  "/identity/authn/logout": {
    post: { responses: { 204: { content?: never } } };
  };
  "/identity/me": {
    get: { responses: { 200: { content: { "application/json": components["schemas"]["User"] } } } };
  };
  "/workspace/projects": {
    get: {
      parameters: { query?: { search?: string; cursor?: string; limit?: number } };
      responses: { 200: { content: { "application/json": components["schemas"]["ProjectList"] } } };
    };
    post: {
      requestBody: { content: { "application/json": { name: string } } };
      responses: { 201: { content: { "application/json": components["schemas"]["Project"] } } };
    };
  };
  "/workspace/projects/{project_id}": {
    get: {
      parameters: { path: { project_id: string } };
      responses: { 200: { content: { "application/json": components["schemas"]["Project"] } } };
    };
  };
  "/assistant/runs": {
    get: {
      parameters: { query: { project: string; status?: "active"; cursor?: string; limit?: number } };
      responses: { 200: { content: { "application/json": components["schemas"]["RunList"] } } };
    };
  };
}

export interface components {
  schemas: {
    User: { id: string; email: string; name: string; role: "admin" | "member"; active: boolean };
    LoginRequest: { email: string; password: string };
    LoginResponse: { access_token: string; refresh_token: string; user: components["schemas"]["User"] };
    RefreshResponse: { access_token: string; refresh_token: string };
    ProgressStep: { state: "empty" | "incomplete" | "ready" | "running" | "done"; label: string };
    Project: {
      id: string;
      name: string;
      owner: { id: string; name: string };
      plant_version: number | null;
      case_version: number | null;
      created: string;
      updated: string;
      progress: {
        case: components["schemas"]["ProgressStep"];
        plant: components["schemas"]["ProgressStep"];
        study: components["schemas"]["ProgressStep"];
        results: components["schemas"]["ProgressStep"];
        report: components["schemas"]["ProgressStep"];
      };
    };
    ProjectList: { items: components["schemas"]["Project"][]; next: string | null };
    Run: {
      id: string;
      chat: string;
      project: string;
      status: "queued" | "running" | "waiting" | "done" | "failed" | "cancelled";
      loop: string;
      started: string;
      ended: string | null;
      usage: { input_tokens: number; output_tokens: number; cost: number };
      request: unknown;
      error: { code: string; message: string } | null;
    };
    RunList: { items: components["schemas"]["Run"][]; next: string | null };
  };
}
