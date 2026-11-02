import { describe, expect, it } from "vitest";
import { toApiMode } from "./mode";

describe("toApiMode", () => {
  it("is mock by default in development", () => {
    expect(toApiMode(undefined, true)).toBe("mock");
  });

  it("accepts an explicit real mode in development", () => {
    expect(toApiMode("real", true)).toBe("real");
  });

  it("is always real in a production build, even when asked for mock", () => {
    expect(toApiMode("mock", false)).toBe("real");
    expect(toApiMode(undefined, false)).toBe("real");
  });

  it("rejects an unknown value", () => {
    expect(() => toApiMode("fake", true)).toThrow(/VITE_API_MODE/);
  });
});
