import type { JsonSchema } from "./json-schema";

const exampleQuantity = (units: string[]): JsonSchema => ({
  type: "object",
  required: ["value", "unit"],
  properties: { value: { type: "number" }, unit: { enum: units } },
});

/** Example case-like schema for tests and mocks: a header, quantities with units, a list, a variant. */
export const exampleCaseSchema: JsonSchema = {
  type: "object",
  required: ["format", "kind", "name"],
  properties: {
    format: { const: 1 },
    kind: { const: "case" },
    name: { type: "string" },
    about: { type: "object" },
    site: {
      type: "object",
      required: ["ground"],
      properties: {
        ground: {
          type: "object",
          required: ["gradient"],
          properties: {
            gradient: exampleQuantity(["K/km", "K/m"]),
            surface_temperature: exampleQuantity(["degC", "K"]),
          },
        },
      },
    },
    economics: {
      anyOf: [
        { type: "string" },
        {
          type: "object",
          required: ["discount_rate"],
          properties: { discount_rate: exampleQuantity(["%"]) },
        },
      ],
    },
    requirements: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, max: { type: "number", unit: "K" } },
      },
    },
  },
};
