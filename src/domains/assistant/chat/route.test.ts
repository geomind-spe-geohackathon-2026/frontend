import { describe, expect, it } from "vitest";
import { toPretty } from "./pretty";
import { fromRoute, toRouteLabel } from "./route";

describe("fromRoute", () => {
  it("reads a loop route and labels it", () => {
    const route = fromRoute('{"kind": "loop", "loop": "tool", "agent": "code_assistant"}');
    expect(route).toEqual({ kind: "loop", loop: "tool", agent: "code_assistant" });
    if (route?.kind !== "loop") throw new Error("not a loop route");
    expect(toRouteLabel(route)).toBe("Routed to code assistant, tool loop");
  });

  it("reads a direct answer", () => {
    expect(fromRoute('{"kind": "answer", "answer": "Yes."}')).toEqual({
      kind: "answer",
      answer: "Yes.",
    });
  });

  it("leaves other text alone", () => {
    expect(fromRoute("Hello")).toBeNull();
    expect(fromRoute('{"kind": "other"}')).toBeNull();
  });
});

describe("toPretty", () => {
  it("indents a Python dict and keeps commas inside strings", () => {
    expect(toPretty("{'name': 'a, b', 'items': [1, 2]}")).toBe(
      "{\n  'name': 'a, b',\n  'items': [\n    1,\n    2\n  ]\n}",
    );
  });
});
