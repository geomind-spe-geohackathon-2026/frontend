import { describe, expect, it } from "vitest";
import { toMissingModules, toNextModule } from "./validity-status";

const graph = {
  modules: [
    { id: "a", type: "T" },
    { id: "b", type: "T" },
    { id: "c", type: "T" },
  ],
  connections: [],
};

function missing(path: string) {
  return { path, code: "missing_value", message: "no value" };
}

describe("toMissingModules", () => {
  it("lists modules once, in plant order, without other problems", () => {
    const problems = [
      missing("params.c.x"),
      missing("params.a.y"),
      missing("params.a.z"),
      { path: "params.b.x", code: "invalid", message: "bad" },
    ];
    expect(toMissingModules(problems, graph)).toEqual(["a", "c"]);
  });
});

describe("toNextModule", () => {
  it("goes round the list and starts at the first", () => {
    expect(toNextModule(["a", "c"], null)).toBe("a");
    expect(toNextModule(["a", "c"], "a")).toBe("c");
    expect(toNextModule(["a", "c"], "c")).toBe("a");
    expect(toNextModule(["a", "c"], "b")).toBe("a");
    expect(toNextModule([], null)).toBeNull();
  });
});
