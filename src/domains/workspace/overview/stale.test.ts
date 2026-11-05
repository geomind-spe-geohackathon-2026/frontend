import { describe, expect, it } from "vitest";
import { toStaleSteps } from "./stale";

const project = { case_version: 3, plant_version: 2 };
const made = (case_version: number, plant_version: number, created = "2026-11-05T10:00:00Z") => ({
  case_version,
  plant_version,
  created,
});

describe("toStaleSteps", () => {
  it("marks study and results stale when the latest result used an older problem", () => {
    expect([...toStaleSteps(project, [made(2, 2)])]).toEqual(["study", "results"]);
  });

  it("marks them stale when it used an older plant", () => {
    expect(toStaleSteps(project, [made(3, 1)]).size).toBe(2);
  });

  it("marks nothing when the result is current or there is no result", () => {
    expect(toStaleSteps(project, [made(3, 2)]).size).toBe(0);
    expect(toStaleSteps(project, undefined).size).toBe(0);
  });

  it("judges by the newest result, not the first in the list", () => {
    const list = [made(2, 1, "2026-11-05T09:00:00Z"), made(3, 2, "2026-11-05T11:00:00Z")];
    expect(toStaleSteps(project, list).size).toBe(0);
  });
});
