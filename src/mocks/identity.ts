import { http, HttpResponse, type RequestHandler } from "msw";
import type {
  Credentials,
  NewUser,
  PasswordChange,
  TokenPair,
  User,
  UserChanges,
} from "@/shared/api/types";
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

function toTokens(userId: string, counter: number): TokenPair {
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

function toCaller(request: Request, users: User[]): User | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const userId = toUserId(token, "example-access");
  return users.find((user) => user.id === userId) ?? null;
}

type State = { users: User[]; passwords: Map<string, string> };

function createState(): State {
  return {
    users: accounts.map((account) => ({ ...account.user })),
    passwords: new Map(accounts.map((account) => [account.user.id, account.password])),
  };
}

function authHandlers(state: State): RequestHandler[] {
  let counter = 0;
  return [
    http.post<NoParams, Credentials>(toRoute("/identity/authn/login"), async ({ request }) => {
      const body = await request.json();
      const user = state.users.find((item) => item.email === body.email);
      const known = user !== undefined && state.passwords.get(user.id) === body.password;
      if (!known || !user.active) {
        return toErrorResponse(401, "unauthorized", "Wrong email or password");
      }
      counter += 1;
      return HttpResponse.json({ ...toTokens(user.id, counter), user });
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
  ];
}

function meHandlers(state: State): RequestHandler[] {
  return [
    http.get(toRoute("/identity/me"), ({ request }) => {
      const user = toCaller(request, state.users);
      if (user === null) return toErrorResponse(401, "unauthorized", "Sign in again");
      return HttpResponse.json(user);
    }),
    http.post<NoParams, PasswordChange>(toRoute("/identity/me/password"), async ({ request }) => {
      const user = toCaller(request, state.users);
      if (user === null) return toErrorResponse(401, "unauthorized", "Sign in again");
      const body = await request.json();
      if (state.passwords.get(user.id) !== body.old_password) {
        return toErrorResponse(422, "validation_failed", "The current password is wrong");
      }
      state.passwords.set(user.id, body.new_password);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

function userHandlers(state: State): RequestHandler[] {
  return [
    http.get(toRoute("/identity/users"), ({ request }) => {
      if (toCaller(request, state.users)?.role !== "admin") {
        return toErrorResponse(403, "forbidden", "Only admins can manage users");
      }
      return HttpResponse.json({ items: state.users, next: null });
    }),
    http.post<NoParams, NewUser>(toRoute("/identity/users"), async ({ request }) => {
      if (toCaller(request, state.users)?.role !== "admin") {
        return toErrorResponse(403, "forbidden", "Only admins can manage users");
      }
      const body = await request.json();
      if (state.users.some((user) => user.email === body.email)) {
        return toErrorResponse(409, "conflict", "A user with this email exists");
      }
      const user: User = {
        id: `example-user-${String(state.users.length + 1)}`,
        email: body.email,
        name: body.name,
        role: body.role,
        active: true,
      };
      state.users.push(user);
      state.passwords.set(user.id, body.password);
      return HttpResponse.json(user, { status: 201 });
    }),
    http.patch<{ id: string }, UserChanges>(
      toRoute("/identity/users/:id"),
      async ({ request, params }) => {
        if (toCaller(request, state.users)?.role !== "admin") {
          return toErrorResponse(403, "forbidden", "Only admins can manage users");
        }
        const user = state.users.find((item) => item.id === params.id);
        if (user === undefined) return toErrorResponse(404, "not_found", "User not found");
        Object.assign(user, await request.json());
        return HttpResponse.json(user);
      },
    ),
  ];
}

/** Example sign in, profile, password and admin user routes with in-memory state; other credentials fail with 401. */
export function identityHandlers(): RequestHandler[] {
  const state = createState();
  return [...authHandlers(state), ...meHandlers(state), ...userHandlers(state)];
}
