import { describe, expect, it } from "vitest";
import { exampleCaseSchema } from "./example-schema";
import {
  formEntries,
  offersChoice,
  pickVariant,
  sectionsOf,
  unitsOf,
  withHeader,
} from "./json-schema";

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
    expect(pickVariant(economics, undefined).properties).toBeDefined();
  });
});

describe("alternatives of a file of its own", () => {
  const economics = {
    anyOf: [
      { type: "string" },
      {
        title: "Economics",
        type: "object",
        properties: {
          format: { const: 1 },
          kind: { type: "string" },
          name: { type: "string" },
          rate: { type: "number" },
        },
      },
    ],
  };

  it("offers no choice for an empty value or a filled form", () => {
    expect(offersChoice(economics, undefined)).toBe(false);
    expect(offersChoice(economics, { rate: 1 })).toBe(false);
    expect(offersChoice(economics, "economics.json")).toBe(true);
  });

  it("hides the header from the form and adds it to a filled form", () => {
    const form = pickVariant(economics, undefined);
    expect(formEntries(form).map(([key]) => key)).toEqual(["rate"]);
    expect(withHeader(economics, "economics", { rate: 1 })).toEqual({
      format: 1,
      kind: "economics",
      name: "economics",
      rate: 1,
    });
    expect(withHeader(economics, "economics", {})).toEqual({});
  });
});
