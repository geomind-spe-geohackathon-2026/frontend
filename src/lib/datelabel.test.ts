import { describe, expect, it } from "vitest";
import { toDateLabel } from "./datelabel";

const now = new Date(2026, 10, 2, 15, 0);

describe("toDateLabel", () => {
  it("shows the clock time for today", () => {
    expect(toDateLabel(new Date(2026, 10, 2, 9, 41).toISOString(), now)).toBe("09:41");
  });

  it("shows month and day for earlier days of this year", () => {
    expect(toDateLabel(new Date(2026, 9, 31, 9, 41).toISOString(), now)).toBe("Oct 31");
  });

  it("shows the year for other years", () => {
    expect(toDateLabel(new Date(2025, 0, 5, 9, 41).toISOString(), now)).toBe("Jan 5, 2025");
  });
});
