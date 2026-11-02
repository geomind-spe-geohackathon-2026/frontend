import { describe, expect, it } from "vitest";
import { toActivityPath } from "./link";

describe("toActivityPath", () => {
  it("joins project, route and id", () => {
    expect(toActivityPath("p1", { route: "design/results", id: "r1" })).toBe(
      "/projects/p1/design/results/r1",
    );
  });

  it("leaves out a missing id and stray slashes", () => {
    expect(toActivityPath("p1", { route: "/design/plant/", id: null })).toBe(
      "/projects/p1/design/plant",
    );
  });
});
