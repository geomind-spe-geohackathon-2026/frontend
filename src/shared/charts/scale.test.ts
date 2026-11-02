import { describe, expect, it } from "vitest";
import { toLinearScale, toNiceTicks, toPaddedDomain } from "./scale";

describe("toLinearScale", () => {
  it("maps the domain ends to the range ends", () => {
    const scale = toLinearScale([0, 10], [100, 0]);
    expect(scale(0)).toBe(100);
    expect(scale(10)).toBe(0);
    expect(scale(5)).toBe(50);
  });

  it("maps a flat domain to the middle of the range", () => {
    expect(toLinearScale([3, 3], [0, 10])(3)).toBe(5);
  });
});

describe("toNiceTicks", () => {
  it("returns round values covering the interval", () => {
    expect(toNiceTicks(35, 55, 5)).toEqual([35, 40, 45, 50, 55]);
  });

  it("returns one tick for a flat interval", () => {
    expect(toNiceTicks(4, 4, 5)).toEqual([4]);
  });
});

describe("toPaddedDomain", () => {
  it("widens by a fraction and gives a flat interval one unit each side", () => {
    expect(toPaddedDomain(0, 10, 0.1)).toEqual([-1, 11]);
    expect(toPaddedDomain(2, 2, 0.1)).toEqual([1, 3]);
  });
});
