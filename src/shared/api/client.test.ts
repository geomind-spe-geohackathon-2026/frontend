import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/testing/server";
import { createApiClient, toBaseUrl } from "./client";
import { ApiError } from "./errors";
import { session } from "./session";

const client = createApiClient(toBaseUrl(undefined));
const me = "*/api/v1/identity/me";
const refresh = "*/api/v1/identity/authn/refresh";
const user = { id: "u1", email: "a@example.test", name: "A", role: "member", active: true };

function expireOldTokens(calls: { refresh: number }) {
  server.use(
    http.get(me, ({ request }) => {
      if (request.headers.get("Authorization") !== "Bearer new-access") {
        return HttpResponse.json(
          { error: { code: "unauthorized", message: "Token expired", details: {} } },
          { status: 401 },
        );
      }
      return HttpResponse.json(user);
    }),
    http.post(refresh, async () => {
      calls.refresh += 1;
      await Promise.resolve();
      return HttpResponse.json({ access_token: "new-access", refresh_token: "new-refresh" });
    }),
  );
}

describe("api client", () => {
  it("sends the bearer token", async () => {
    session.set({ accessToken: "token-1", refreshToken: "refresh-1" });
    let header: string | null = null;
    server.use(
      http.get(me, ({ request }) => {
        header = request.headers.get("Authorization");
        return HttpResponse.json(user);
      }),
    );
    await client.GET("/identity/me");
    expect(header).toBe("Bearer token-1");
  });

  it("refreshes once for parallel 401 answers, keeps the rotated refresh token and retries", async () => {
    session.set({ accessToken: "old-access", refreshToken: "old-refresh" });
    const calls = { refresh: 0 };
    expireOldTokens(calls);
    const results = await Promise.all([
      client.GET("/identity/me"),
      client.GET("/identity/me"),
      client.GET("/identity/me"),
    ]);
    expect(results.map((result) => result.data?.id)).toEqual(["u1", "u1", "u1"]);
    expect(calls.refresh).toBe(1);
    expect(session.get()).toEqual({ accessToken: "new-access", refreshToken: "new-refresh" });
  });

  it("signs out when the refresh fails and throws the contract error", async () => {
    session.set({ accessToken: "old-access", refreshToken: "old-refresh" });
    const unauthorized = { error: { code: "unauthorized", message: "No", details: {} } };
    server.use(
      http.get(me, () => HttpResponse.json(unauthorized, { status: 401 })),
      http.post(refresh, () => HttpResponse.json(unauthorized, { status: 401 })),
    );
    await expect(client.GET("/identity/me")).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    });
    expect(session.get()).toBeNull();
  });

  it("does not try to refresh a failed sign in", async () => {
    const calls = { refresh: 0 };
    server.use(
      http.post("*/api/v1/identity/authn/login", () =>
        HttpResponse.json(
          { error: { code: "unauthorized", message: "Wrong email or password", details: {} } },
          { status: 401 },
        ),
      ),
      http.post(refresh, () => {
        calls.refresh += 1;
        return HttpResponse.json({});
      }),
    );
    session.set({ accessToken: "a", refreshToken: "r" });
    await expect(
      client.POST("/identity/authn/login", { body: { email: "a", password: "b" } }),
    ).rejects.toThrow("Wrong email or password");
    expect(calls.refresh).toBe(0);
  });

  it("maps the contract error body with details to ApiError", async () => {
    server.use(
      http.get(me, () =>
        HttpResponse.json(
          { error: { code: "conflict", message: "Stale", details: { latest: 4 } } },
          { status: 409 },
        ),
      ),
    );
    const error: unknown = await client.GET("/identity/me").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: "conflict", details: { latest: 4 } });
  });

  it("maps a body that is not the contract shape to unknown_error", async () => {
    server.use(http.get(me, () => new HttpResponse("oops", { status: 500 })));
    await expect(client.GET("/identity/me")).rejects.toMatchObject({
      status: 500,
      code: "unknown_error",
    });
  });

  it("maps a network failure to network_error", async () => {
    server.use(http.get(me, () => HttpResponse.error()));
    await expect(client.GET("/identity/me")).rejects.toMatchObject({ code: "network_error" });
  });
});
