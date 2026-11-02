import { describe, expect, it } from "vitest";
import { exampleCaseSchema } from "./example-schema";
import { findMissing } from "./missing";
import { createSchemaResolver, validateDocument } from "./resolver";

const header = { format: 1, kind: "case", name: "example" };

const gradient = (value: unknown, unit: string) => ({
  site: { ground: { gradient: { value, unit } } },
});

describe("schema validation", () => {
  it("accepts a document with missing values: missing is not a problem", () => {
    expect(validateDocument(exampleCaseSchema, { format: 1, kind: "case" })).toEqual([]);
  });

  it("reports a wrong unit and a wrong type with their paths", () => {
    const problems = validateDocument(exampleCaseSchema, gradient("x", "m3/h"));
    const paths = problems.map((problem) => problem.path);
    expect(paths).toContain("site.ground.gradient.value");
    expect(paths).toContain("site.ground.gradient.unit");
  });

  it("returns nested errors for react-hook-form under the form root", async () => {
    const resolver = createSchemaResolver(exampleCaseSchema);
    const result = await resolver({ v: gradient(1, "bad") }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    });
    expect(result.errors).toMatchObject({
      v: { site: { ground: { gradient: { unit: { type: "enum" } } } } },
    });
  });
});

describe("missing values", () => {
  it("lists required properties with no value, down to a quantity without a value", () => {
    expect(findMissing(exampleCaseSchema, { ...header, site: { ground: {} } })).toEqual([
      "site.ground.gradient",
    ]);
    expect(findMissing(exampleCaseSchema, { ...header, ...gradient(undefined, "K/km") })).toEqual([
      "site.ground.gradient",
    ]);
    expect(findMissing(exampleCaseSchema, { ...header, ...gradient(30, "K/km") })).toEqual([]);
  });
});
