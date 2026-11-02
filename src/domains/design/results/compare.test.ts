import { describe, expect, it } from "vitest";
import type { Result } from "@/shared/api/types";
import { toChecksText, toMergedPoints, toSharedKpis } from "./compare";

function result(kpis: Result["kpis"]): Result {
  return {
    id: "r",
    name: "r",
    study: null,
    case_version: 1,
    plant_version: 1,
    kpis,
    checks: { passed: 0, failed: 0, not_assessed: 0 },
    role: "design",
    doublets: null,
    depth: null,
    depth_unit: null,
    created: "2026-11-02T10:00:00Z",
  };
}

describe("toSharedKpis", () => {
  it("leaves out a figure that has no value in some result, as it cannot be plotted", () => {
    const first = result([
      { name: "cold", title: "cold", value: null, unit: "MWh", reason: null },
      { name: "lcts", title: "lcts", value: 40, unit: "EUR/MWh", reason: null },
    ]);
    const second = result([
      { name: "cold", title: "cold", value: 3, unit: "MWh", reason: null },
      { name: "lcts", title: "lcts", value: 41, unit: "EUR/MWh", reason: null },
    ]);
    expect(toSharedKpis([first, second]).map((kpi) => kpi.name)).toEqual(["lcts"]);
  });
});

describe("toMergedPoints", () => {
  it("joins points in the same place under one label", () => {
    const point = { id: "a", label: "A", x: 1, y: 2 };
    expect(toMergedPoints([point, { ...point, id: "b", label: "B" }])).toEqual([
      { ...point, label: "A (+1)" },
    ]);
  });
});

describe("toChecksText", () => {
  it("says all passed only when every check was assessed", () => {
    const checks = (passed: number, failed: number, notAssessed: number) => ({
      ...result([]),
      checks: { passed, failed, not_assessed: notAssessed },
    });
    expect(toChecksText(checks(9, 0, 0))).toBe("all passed");
    expect(toChecksText(checks(8, 0, 1))).toBe("1 not assessed");
    expect(toChecksText(checks(7, 2, 1))).toBe("2 failed");
  });
});
