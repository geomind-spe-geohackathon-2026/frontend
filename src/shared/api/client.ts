import createClient from "openapi-fetch";
import { ApiError, fromResponse } from "./errors";
import { session } from "./session";
import type { paths } from "./schema";
import type { TokenPair } from "./types";

const authPath = "/identity/authn/";

/** Resolves the absolute /api/v1 base url from VITE_API_URL, or the page origin when unset. */
export function toBaseUrl(raw: string | undefined): string {
  return new URL(raw ?? "/api/v1", window.location.origin).toString().replace(/\/$/, "");
}

async function send(request: Request, accessToken: string | null): Promise<Response> {
  const headers = new Headers(request.headers);
  if (accessToken !== null) headers.set("Authorization", `Bearer ${accessToken}`);
  try {
    return await fetch(new Request(request, { headers }));
  } catch {
    throw new ApiError({
      status: 0,
      code: "network_error",
      message: "The server cannot be reached",
    });
  }
}

function isTokenPair(value: unknown): value is TokenPair {
  if (typeof value !== "object" || value === null) return false;
  return (
    "access_token" in value &&
    typeof value.access_token === "string" &&
    "refresh_token" in value &&
    typeof value.refresh_token === "string"
  );
}

async function isRefreshed(baseUrl: string): Promise<boolean> {
  const tokens = session.get();
  if (tokens === null) return false;
  const request = new Request(`${baseUrl}${authPath}refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refreshToken }),
  });
  const response = await send(request, null);
  if (!response.ok) {
    session.clear();
    return false;
  }
  const body: unknown = await response.json();
  if (!isTokenPair(body)) {
    throw new ApiError({
      status: response.status,
      code: "invalid_response",
      message: "The refresh answer has no tokens",
    });
  }
  session.set({ accessToken: body.access_token, refreshToken: body.refresh_token });
  return true;
}

function createAuthFetch(baseUrl: string): (request: Request) => Promise<Response> {
  let refreshing: Promise<boolean> | null = null;

  function refreshOnce(): Promise<boolean> {
    refreshing ??= isRefreshed(baseUrl).finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function sendWithRefresh(request: Request): Promise<Response> {
    const retry = request.clone();
    const used = session.get()?.accessToken ?? null;
    const response = await send(request, used);
    const canRefresh = response.status === 401 && !new URL(request.url).pathname.includes(authPath);
    if (!canRefresh) return response;
    const latest = session.get()?.accessToken ?? null;
    if (latest === used && !(await refreshOnce())) return response;
    return send(retry, session.get()?.accessToken ?? null);
  }

  return async (request) => {
    const response = await sendWithRefresh(request);
    if (!response.ok) throw await fromResponse(response);
    return response;
  };
}

/** Builds the typed /api/v1 client: bearer token, single-flight refresh on 401, ApiError on failure. */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl, fetch: createAuthFetch(baseUrl) });
}

/** The application client. */
export const api = createApiClient(toBaseUrl(import.meta.env.VITE_API_URL));

/** Returns the body of a successful result, or throws when the response had no body. */
export function toData<T>(result: { data?: T; response: Response }): T {
  if (result.data === undefined) {
    throw new ApiError({
      status: result.response.status,
      code: "empty_response",
      message: "The server answered without a body",
    });
  }
  return result.data;
}

type FormValue = Blob | string | number | null | undefined;

/** Builds the multipart body of a request from its fields; null and missing fields are left out. */
export function toFormData(fields: Record<string, FormValue>): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    form.set(name, typeof value === "number" ? String(value) : value);
  }
  return form;
}
