import { describe, expect, it } from "vitest";
import { expectedSteps, toPoints, toStats, toTable, valueColumns } from "./series-data";

const text = "time,heat,cold\n2027-01-01T00:00:00Z,2,1\n2027-01-02T00:00:00Z,4,0\n";

describe("series data", () => {
  it("lists the columns without the time", () => {
    expect(valueColumns(toTable(text))).toEqual(["heat", "cold"]);
  });

  it("reads a column and sums it at its own step", () => {
    const stats = toStats(toPoints(toTable(text), "heat"));
    expect(stats).toMatchObject({ count: 2, peak: 4, low: 2, hours: 24, sum: 144 });
  });

  it("counts the steps of a case's time", () => {
    const time = { start: "2027-01-01", end: "2028-01-01", step: { value: 1, unit: "d" } };
    expect(expectedSteps(time)).toBe(365);
    expect(expectedSteps({ start: "2027-01-01" })).toBeNull();
  });
});
