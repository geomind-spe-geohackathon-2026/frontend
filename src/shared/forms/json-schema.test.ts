import { describe, expect, it } from "vitest";
import { exampleCaseSchema } from "./example-schema";
import {
  formEntries,
  pickVariant,
  sectionsOf,
  toRequirementSchema,
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

describe("requirement choices", () => {
  const schema = {
    "x-roles": { boiler: { heat_output: ["MW", "W"], cop: [] } },
    "x-time-units": ["d", "h"],
    properties: { quantity: { enum: ["heat_output", "flow"] }, unit: { type: "string" } },
  };

  it("lists the quantities of the role and the units of the quantity", () => {
    const narrowed = toRequirementSchema(schema, { on: "boiler", quantity: "heat_output" });
    expect(narrowed.properties?.quantity?.enum).toEqual(["heat_output", "cop"]);
    expect(narrowed.properties?.unit?.enum).toEqual(["MW", "W"]);
  });

  it("gives time units to a duration", () => {
    const narrowed = toRequirementSchema(schema, { on: "boiler", over: "duration" });
    expect(narrowed.properties?.unit?.enum).toEqual(["d", "h"]);
  });

  it("leaves the schema alone without a role", () => {
    expect(toRequirementSchema(schema, {})).toBe(schema);
  });
});
