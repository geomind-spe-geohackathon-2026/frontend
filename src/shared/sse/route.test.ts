import { describe, expect, it } from "vitest";
import { fromPartialRoute, fromRoute, toRouteLabel } from "./route";

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

describe("fromPartialRoute", () => {
  it("reads the answer so far from a route still being written", () => {
    expect(fromPartialRoute('{"kind": "answer", "answer": "The doublet ')).toBe("The doublet ");
  });

  it("stops before an escape that is not complete yet", () => {
    expect(fromPartialRoute('{"kind": "answer", "answer": "Line one\\n')).toBe("Line one\n");
    expect(fromPartialRoute('{"kind": "answer", "answer": "Line one\\')).toBe("Line one");
    expect(fromPartialRoute('{"kind": "answer", "answer": "\\u06')).toBe("");
  });

  it("leaves out the end of a finished route", () => {
    expect(fromPartialRoute('{"kind": "answer", "answer": "Done"}')).toBe("Done");
  });

  it("gives null for a loop route or any other text", () => {
    expect(fromPartialRoute('{"kind": "loop", "loop"')).toBeNull();
    expect(fromPartialRoute("plain words")).toBeNull();
  });
});
