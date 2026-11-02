import { describe, expect, it } from "vitest";
import { exampleCaseSchema } from "./example-schema";
import { pickVariant, sectionsOf, unitsOf } from "./json-schema";

describe("json schema helpers", () => {
  it("takes the sections from the top-level properties that are structured", () => {
    expect(sectionsOf(exampleCaseSchema)).toEqual(["site", "economics", "requirements"]);
  });

  it("lists the units of a quantity", () => {
    const gradient = exampleCaseSchema.properties?.site?.properties?.ground?.properties?.gradient;
    expect(unitsOf(gradient ?? {})).toEqual(["K/km", "K/m"]);
  });

  it("picks the alternative that fits the value", () => {
    const economics = exampleCaseSchema.properties?.economics ?? {};
    expect(pickVariant(economics, "economics.json").type).toBe("string");
    expect(pickVariant(economics, { discount_rate: { value: 1 } }).properties).toBeDefined();
    expect(pickVariant(economics, undefined).type).toBe("string");
  });
});
