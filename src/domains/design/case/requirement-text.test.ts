import { describe, expect, it } from "vitest";
import { toRequirementText } from "./requirement-text";

describe("toRequirementText", () => {
  it("writes a range while running", () => {
    const item = {
      on: "doublet",
      quantity: "production_flow",
      over: "each",
      when: "running",
      min: 50,
      max: 300,
      unit: "m3/h",
    };
    expect(toRequirementText(item)).toBe(
      "Each doublet, while running: production flow between 50 and 300 m3/h",
    );
  });

  it("writes a duration", () => {
    const item = {
      on: "doublet",
      quantity: "production_flow",
      over: "duration",
      max: 330,
      unit: "d",
    };
    expect(toRequirementText(item)).toContain("running duration at most 330 d");
  });

  it("says nothing for another item", () => {
    expect(toRequirementText({ name: "x" })).toBeNull();
  });
});
