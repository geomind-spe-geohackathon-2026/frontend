import { describe, expect, it } from "vitest";
import { fromLayout } from "./layout";

describe("fromLayout", () => {
  it("keeps positions with numeric x and y and drops the rest", () => {
    expect(fromLayout({ hx: { x: 1, y: 2 }, pump: { x: "1", y: 2 }, bad: null })).toEqual({
      hx: { x: 1, y: 2 },
    });
  });
});
