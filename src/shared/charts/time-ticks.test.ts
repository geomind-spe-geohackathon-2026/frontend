import { describe, expect, it } from "vitest";
import { toEnergy, toTimeTicks } from "./time-ticks";

describe("time ticks", () => {
  it("gives months over a year", () => {
    const ticks = toTimeTicks(Date.UTC(2027, 0, 1), Date.UTC(2027, 11, 31));
    expect(ticks.map((tick) => tick.label)).toHaveLength(12);
    expect(ticks[0]?.label).toBe("Jan");
  });

  it("gives days over a week", () => {
    const ticks = toTimeTicks(Date.UTC(2027, 0, 1), Date.UTC(2027, 0, 7));
    expect(ticks).toHaveLength(7);
  });

  it("gives years over a long span", () => {
    const ticks = toTimeTicks(Date.UTC(2027, 0, 1), Date.UTC(2032, 0, 1));
    expect(ticks.map((tick) => tick.label)).toContain("2030");
  });

  it("writes energy in a readable unit", () => {
    expect(toEnergy(111_667, "MW")).toBe("111.7 GWh");
    expect(toEnergy(1, "m3/h")).toBeNull();
  });
});
