import { describe, expect, it } from "vitest";
import { expectedSteps, toPoints, toTable, valueColumns } from "./series-data";

const text = "time,heat,cold\n2027-01-01T00:00:00Z,2,1\n2027-01-02T00:00:00Z,4,0\n";

describe("series data", () => {
  it("lists the columns without the time", () => {
    expect(valueColumns(toTable(text))).toEqual(["heat", "cold"]);
  });

  it("reads a column with its times", () => {
    expect(toPoints(toTable(text), "heat")).toEqual([
      { time: "2027-01-01T00:00:00Z", value: 2 },
      { time: "2027-01-02T00:00:00Z", value: 4 },
    ]);
  });

  it("counts the steps of a case's time", () => {
    const time = { start: "2027-01-01", end: "2028-01-01", step: { value: 1, unit: "d" } };
    expect(expectedSteps(time)).toBe(365);
    expect(expectedSteps({ start: "2027-01-01" })).toBeNull();
  });
});
