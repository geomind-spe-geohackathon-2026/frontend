import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/errors";
import { fromEvent } from "./events";

const origin = { agent: "coordinator", parent: null };

describe("fromEvent", () => {
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
