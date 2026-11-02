import { http, HttpResponse, type RequestHandler } from "msw";
import type { LoginRequest, RefreshResponse, User } from "@/shared/api/types";
import { toErrorResponse } from "./errors";
import { toRoute, type NoParams } from "./url";

export const exampleAdmin = {
  user: {
    id: "example-user-admin",
    email: "example-admin@example.test",
    name: "Example Admin",
    role: "admin",
    active: true,
  },
  password: "example-password",
} as const;

export const exampleMember = {
  user: {
    id: "example-user-member",
    email: "example-member@example.test",
    name: "Example Member",
    role: "member",
    active: true,
  },
  password: "example-password",
} as const;

const accounts = [exampleAdmin, exampleMember];

function toTokens(userId: string, counter: number): RefreshResponse {
  return {
    access_token: `example-access.${userId}.${String(counter)}`,
    refresh_token: `example-refresh.${userId}.${String(counter)}`,
  };
}

function toUserId(token: string | null | undefined, prefix: string): string | null {
  const parts = token?.split(".") ?? [];
  if (parts[0] !== prefix || parts[1] === undefined) return null;
  return parts[1];
}

function findUser(request: Request): User | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const userId = toUserId(token, "example-access");
  return accounts.find((account) => account.user.id === userId)?.user ?? null;
}

/** Fixed example sign in and user routes; any other credentials fail with 401. */
export function identityHandlers(): RequestHandler[] {
  let counter = 0;
  return [
    http.post<NoParams, LoginRequest>(toRoute("/identity/authn/login"), async ({ request }) => {
      const body = await request.json();
      const account = accounts.find(
        (item) => item.user.email === body.email && item.password === body.password,
      );
      if (account === undefined) {
        return toErrorResponse(401, "unauthorized", "Wrong email or password");
      }
      counter += 1;
      return HttpResponse.json({ ...toTokens(account.user.id, counter), user: account.user });
    }),
    http.post<NoParams, { refresh_token: string }>(
      toRoute("/identity/authn/refresh"),
      async ({ request }) => {
        const body = await request.json();
        const userId = toUserId(body.refresh_token, "example-refresh");
        if (userId === null)
          return toErrorResponse(401, "unauthorized", "Refresh token is invalid");
        counter += 1;
        return HttpResponse.json(toTokens(userId, counter));
      },
    ),
    http.post(toRoute("/identity/authn/logout"), () => new HttpResponse(null, { status: 204 })),
    http.get(toRoute("/identity/me"), ({ request }) => {
      const user = findUser(request);
      if (user === null) return toErrorResponse(401, "unauthorized", "Sign in again");
      return HttpResponse.json(user);
    }),
  ];
}
