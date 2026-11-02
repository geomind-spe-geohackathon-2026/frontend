import { describe, expect, it } from "vitest";
import { toFailureText, toPretty, toBudgetStop, toSummary } from "./pretty";

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

describe("collapsed rows", () => {
  it("never shows Python text it cannot read", () => {
    expect(toSummary("{'a': {'b': 'cut of")).not.toContain("{");
    expect(toSummary("[{'service': 'heating', 'x': {'y' : [1, (2")).not.toContain("'");
  });
});

describe("toBudgetStop", () => {
  it("writes a budget stop as a sentence", () => {
    expect(toBudgetStop("project cost budget: 9b6c used 0.01632422 of 0.01")).toBe(
      "Stopped: this project reached its budget of 0.01 USD (spent 0.016 USD). Raise the budget in project settings to continue.",
    );
  });

  it("leaves another failure", () => {
    expect(toBudgetStop("it broke")).toBeNull();
  });
});

describe("toFailureText on a chat without a case", () => {
  it("says what to do instead of naming the assistant's tools", () => {
    const error = "{'error': {'message': \"case: the problem state has no case; expected one.\"}}";
    expect(toFailureText(error)).toMatch(/case is not complete yet/);
  });
});
