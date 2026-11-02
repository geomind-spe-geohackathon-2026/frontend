import { describe, expect, it } from "vitest";
import { getAt, isEqualDocument, prune, toDotted } from "./document";

describe("document helpers", () => {
  it("reads nested values by dotted path and list index", () => {
    const document = { a: { b: [{ c: 5 }] } };
    expect(getAt(document, "a.b.0.c")).toBe(5);
    expect(getAt(document, toDotted("a.b[0].c"))).toBe(5);
    expect(getAt(document, "a.x.c")).toBeUndefined();
  });

  it("prunes undefined values and empty objects but keeps list items", () => {
    expect(prune({ a: undefined, b: { c: undefined }, d: [{}], e: 0 })).toEqual({ d: [{}], e: 0 });
  });

  it("compares documents ignoring key order and empty parts", () => {
    expect(isEqualDocument({ a: 1, b: { c: undefined } }, { b: {}, a: 1 })).toBe(true);
    expect(isEqualDocument({ a: 1 }, { a: 2 })).toBe(false);
  });
});
