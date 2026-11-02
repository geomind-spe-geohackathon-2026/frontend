import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/errors";
import { fromEvent, fromRunId } from "./events";

const origin = { agent: "coordinator", parent: null };

describe("fromEvent", () => {
  it("skips an event of a type it does not know", () => {
    expect(fromEvent("study.recorded", '{"study": "study/first"}', "9")).toBeNull();
  });

  it("reads the sequence from the id and the agent and parent from the data", () => {
    const data = JSON.stringify({ ...origin, index: 0, text: "Hello" });
    expect(fromEvent("text.delta", data, "7")).toEqual({
      type: "text.delta",
      sequence: 7,
      agent: "coordinator",
      parent: null,
      index: 0,
      text: "Hello",
    });
  });

  it("keeps buffered true on the one text.delta a reconnect receives, which has no id", () => {
    const data = JSON.stringify({ ...origin, index: 1, text: "So far", buffered: true });
    expect(fromEvent("text.delta", data, "")).toEqual({
      type: "text.delta",
      sequence: null,
      agent: "coordinator",
      parent: null,
      index: 1,
      text: "So far",
      buffered: true,
    });
  });

  it("reads the run.started of a routing run, which has no loop", () => {
    const routing = JSON.stringify({ agent: "coordinator", parent: "p", run: "r-route" });
    expect(fromEvent("run.started", routing, "1")).toMatchObject({ run: "r-route", loop: null });
  });

  it("writes the run ids of an event in the dashed form the API uses", () => {
    const hex = "0123456789abcdef0123456789abcdef";
    const dashed = "01234567-89ab-cdef-0123-456789abcdef";
    const started = JSON.stringify({ ...origin, run: hex, loop: "design" });
    expect(fromEvent("run.started", started, "1")).toMatchObject({ run: dashed });
    const nested = JSON.stringify({
      agent: "coordinator.designer",
      parent: hex,
      index: 0,
      model: "m",
    });
    expect(fromEvent("step.started", nested, "2")).toMatchObject({ parent: dashed });
  });

  it("keeps a missing id as a null sequence", () => {
    const data = JSON.stringify({ ...origin, input_tokens: 1, output_tokens: 2, cost: 0.5 });
    expect(fromEvent("usage", data, "")).toMatchObject({ type: "usage", sequence: null });
  });

  it("reads a question request with options", () => {
    const options = [{ value: "a", label: "A" }];
    const data = JSON.stringify({
      ...origin,
      request: "r1",
      kind: "question",
      message: "Which one?",
      options,
    });
    expect(fromEvent("request", data, "3")).toMatchObject({ kind: "question", options });
  });

  it("reads the error of a failed tool", () => {
    const data = JSON.stringify({
      ...origin,
      index: 0,
      call_id: "c1",
      output_summary: "",
      duration: 0.2,
      error: "boom",
    });
    expect(fromEvent("tool.finished", data, "4")).toMatchObject({ error: "boom" });
  });

  it("ignores an event name it does not know and an empty message", () => {
    expect(fromEvent("something.else", JSON.stringify(origin), "1")).toBeNull();
    expect(fromEvent("", "", "")).toBeNull();
  });

  it("throws invalid_event when a field is missing", () => {
    const data = JSON.stringify({ ...origin, index: 0 });
    expect(() => fromEvent("text.delta", data, "1")).toThrow(ApiError);
    expect(() => fromEvent("text.delta", data, "1")).toThrow(/text/);
  });

  it("throws invalid_event for an unknown run status", () => {
    const data = JSON.stringify({ ...origin, status: "paused", stop_reason: "x" });
    expect(() => fromEvent("run.finished", data, "1")).toThrow(ApiError);
  });
});

describe("fromRunId", () => {
  it("turns 32 hex characters into a dashed UUID and leaves other ids as they are", () => {
    expect(fromRunId("0123456789ABCDEF0123456789abcdef")).toBe(
      "01234567-89ab-cdef-0123-456789abcdef",
    );
    expect(fromRunId("01234567-89ab-cdef-0123-456789abcdef")).toBe(
      "01234567-89ab-cdef-0123-456789abcdef",
    );
    expect(fromRunId("example-run-1")).toBe("example-run-1");
  });
});
