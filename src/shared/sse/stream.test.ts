import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { session } from "@/shared/api/session";
import { server } from "@/testing/server";
import { toRoute } from "@/mocks/url";
import { streamEvents } from "./stream";
import type { RunEvent } from "./types";

const frame = (type: string, id: number, data: object) =>
  `event: ${type}\nid: ${String(id)}\ndata: ${JSON.stringify({ agent: "coordinator", parent: null, ...data })}\n\n`;

function listen(path: string, lastEventId?: string) {
  const events: RunEvent[] = [];
  const failures: string[] = [];
  const controller = new AbortController();
  const done = streamEvents({
    path,
    signal: controller.signal,
    isFinished: () => true,
    onEvent: (event) => events.push(event),
    onFailure: (error) => failures.push(error.code),
    ...(lastEventId === undefined ? {} : { lastEventId }),
  });
  return { events, failures, done };
}

describe("streamEvents", () => {
  it("sends the bearer token and Last-Event-ID and delivers the events", async () => {
    session.set({ accessToken: "token-1", refreshToken: "refresh-1" });
    const seen: Headers[] = [];
    server.use(
      http.get(toRoute("/assistant/runs/r1/events"), ({ request }) => {
        seen.push(request.headers);
        const body = frame("usage", 9, { input_tokens: 1, output_tokens: 2, cost: 0.1 });
        return new HttpResponse(body, { headers: { "Content-Type": "text/event-stream" } });
      }),
    );
    const { events, done } = listen("/assistant/runs/r1/events", "8");
    await done;
    expect(seen[0]?.get("authorization")).toBe("Bearer token-1");
    expect(seen[0]?.get("last-event-id")).toBe("8");
    expect(events).toMatchObject([{ type: "usage", sequence: 9 }]);
  });

  it("reports a refused stream as a failure with the contract error code", async () => {
    session.set({ accessToken: "token-1", refreshToken: "refresh-1" });
    server.use(
      http.get(toRoute("/assistant/runs/r2/events"), () =>
        HttpResponse.json(
          { error: { code: "run_not_found", message: "no", details: {} } },
          { status: 404 },
        ),
      ),
    );
    const { failures, done } = listen("/assistant/runs/r2/events");
    await done;
    expect(failures).toEqual(["run_not_found"]);
  });
});
