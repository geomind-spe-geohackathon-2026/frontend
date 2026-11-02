import { describe, expect, it } from "vitest";
import { toStaleSteps } from "./stale";

const project = { case_version: 3, plant_version: 2 };

describe("toStaleSteps", () => {
  it("marks study and results stale when the latest result used an older problem", () => {
    expect([...toStaleSteps(project, { case_version: 2, plant_version: 2 })]).toEqual([
      "study",
      "results",
    ]);
  });

  it("marks them stale when it used an older plant", () => {
    expect(toStaleSteps(project, { case_version: 3, plant_version: 1 }).size).toBe(2);
  });

  it("marks nothing when the result is current or there is no result", () => {
    expect(toStaleSteps(project, { case_version: 3, plant_version: 2 }).size).toBe(0);
    expect(toStaleSteps(project, undefined).size).toBe(0);
  });
});
