import { describe, expect, it } from "vitest";
import { toFailureText, toPretty } from "./pretty";

describe("toPretty", () => {
  it("lays out a Python dict as JSON", () => {
    expect(toPretty("{'a': None, 'b': True, 'c': ['x']}")).toBe(
      JSON.stringify({ a: null, b: true, c: ["x"] }, null, 2),
    );
  });

  it("keeps an apostrophe inside a double-quoted Python string", () => {
    expect(toPretty(`{"a": "the plant's case"}`)).toContain("the plant's case");
  });

  it("closes a result cut off by the summary limit", () => {
    expect(toPretty("{'a': 1, 'b': ['x', 'cut of")).toBe(
      JSON.stringify({ a: 1, b: ["x", "cut of"] }, null, 2),
    );
  });

  it("leaves plain text as it is", () => {
    expect(toPretty("done")).toBe("done");
  });
});

describe("toFailureText", () => {
  it("reads the message of a dict", () => {
    expect(toFailureText("{'code': 'x', 'message': 'case: no case'}")).toBe("case: no case");
  });

  it("keeps a plain error", () => {
    expect(toFailureText("it broke")).toBe("it broke");
  });
});
