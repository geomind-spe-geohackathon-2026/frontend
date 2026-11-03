import { describe, expect, it } from "vitest";
import { toUnitChoices } from "./units";

describe("toUnitChoices", () => {
  it("offers one spelling of a unit", () => {
    expect(toUnitChoices(["C", "K", "degC", "°C"], "")).toEqual(["K", "°C"]);
  });

  it("keeps the spelling the value has", () => {
    expect(toUnitChoices(["C", "K", "degC", "°C"], "degC")).toEqual(["K", "degC", "°C"]);
  });

  it("keeps a spelling with no other one on offer", () => {
    expect(toUnitChoices(["C", "K"], "")).toEqual(["C", "K"]);
  });
});
