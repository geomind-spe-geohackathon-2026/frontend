import { describe, expect, it } from "vitest";
import {
  toFieldResult,
  toFieldText,
  toGroups,
  toParameterFields,
  toRangeText,
  type ParameterField,
} from "./parameter-fields";

const quantity = (units: string[]) => ({
  type: "object",
  required: ["value", "unit"],
  properties: { value: { type: "number" }, unit: { enum: units } },
});

const schema = {
  type: "object",
  properties: {
    conductance: {
      anyOf: [{ type: "number", exclusiveMinimum: 0 }, quantity(["W/K"])],
      unit: "W/K",
      description: "Conductance of the exchanger",
    },
    drop: {
      anyOf: [{ type: "number", minimum: 0 }, quantity(["Pa", "bar"]), { type: "null" }],
      unit: "Pa",
    },
    share: {
      anyOf: [{ type: "number", minimum: 0, maximum: 1 }, quantity(["-", "ppm"])],
      unit: "-",
    },
    stages: { anyOf: [{ type: "integer", exclusiveMinimum: 0 }, quantity(["-"])], unit: "-" },
    dispatch: { anyOf: [{ type: "string", enum: ["least_cost"] }, { type: "null" }] },
    arrangement: { type: "string", enum: ["counterflow", "parallel"] },
    label: { type: "string" },
    lengths: { type: "array", items: { type: "number" }, unit: "m" },
    factors: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      prefixItems: [{ type: "number" }, { type: "number", unit: "Pa" }],
    },
    composition: { anyOf: [{ type: "object" }, { type: "null" }] },
    "well.roughness": { anyOf: [{ type: "number" }, quantity(["m", "mm"])], unit: "m" },
    "well.esp.depth": { anyOf: [{ type: "number" }, quantity(["m"])], unit: "m" },
  },
};

function fieldOf(name: string): ParameterField {
  const found = toParameterFields(schema).find((field) => field.name === name);
  if (found === undefined) throw new Error(name);
  return found;
}

describe("toParameterFields", () => {
  it("reads a number that also takes a quantity as a value with units and a range", () => {
    expect(fieldOf("drop")).toMatchObject({
      kind: "number",
      unit: "Pa",
      units: ["Pa", "bar"],
      lower: { limit: 0, strict: false },
      nullable: true,
    });
    expect(fieldOf("conductance").description).toBe("Conductance of the exchanger");
  });

  it("reads an enum that may be null as a choice with its real options, never as text", () => {
    expect(fieldOf("dispatch")).toMatchObject({
      kind: "choice",
      options: ["least_cost"],
      nullable: true,
    });
    expect(fieldOf("arrangement")).toMatchObject({ kind: "choice", nullable: false });
    expect(fieldOf("label").kind).toBe("text");
  });

  it("reads lists, fixed length lists and free objects", () => {
    expect(fieldOf("lengths")).toMatchObject({ kind: "list", units: ["m"], length: null });
    expect(fieldOf("factors")).toMatchObject({ kind: "list", length: 2 });
    expect(fieldOf("composition").kind).toBe("record");
  });

  it("keeps a child's parameters under their dotted name and group", () => {
    expect(fieldOf("well.esp.depth")).toMatchObject({
      group: "well.esp",
      local: "depth",
      label: "Depth",
    });
    expect(toGroups(toParameterFields(schema))).toEqual(["well", "well.esp"]);
  });
});

describe("toRangeText", () => {
  it("states open and closed limits", () => {
    expect(toRangeText(fieldOf("conductance"))).toBe("> 0");
    expect(toRangeText(fieldOf("drop"))).toBe("≥ 0");
    expect(toRangeText(fieldOf("share"))).toBe("0 to 1");
    expect(toRangeText(fieldOf("label"))).toBeNull();
  });
});

describe("toFieldResult", () => {
  it("sends a value with a dimension with its unit, as gemini refuses a bare number", () => {
    expect(toFieldResult(fieldOf("drop"), { text: "3", unit: "bar" }).value).toEqual({
      value: 3,
      unit: "bar",
    });
    expect(toFieldResult(fieldOf("lengths"), { text: "1, 2", unit: "m" }).value).toEqual({
      value: [1, 2],
      unit: "m",
    });
  });

  it("sends a dimensionless value as a plain number", () => {
    expect(toFieldResult(fieldOf("share"), { text: "0.5", unit: "-" }).value).toBe(0.5);
    expect(toFieldResult(fieldOf("share"), { text: "50", unit: "ppm" }).value).toEqual({
      value: 50,
      unit: "ppm",
    });
  });

  it("clears a nullable value and refuses to clear any other", () => {
    expect(toFieldResult(fieldOf("drop"), { text: "", unit: "Pa" })).toEqual({
      value: null,
      problem: null,
    });
    expect(toFieldResult(fieldOf("conductance"), { text: "", unit: "W/K" }).problem).toBe(
      "This value cannot be empty",
    );
  });

  it("checks the range only in the schema unit, where it holds", () => {
    expect(toFieldResult(fieldOf("drop"), { text: "-1", unit: "Pa" }).problem).toBe("Must be ≥ 0");
    expect(toFieldResult(fieldOf("drop"), { text: "-1", unit: "bar" }).problem).toBeNull();
    expect(toFieldResult(fieldOf("share"), { text: "2", unit: "-" }).problem).toBe(
      "Must be 0 to 1",
    );
  });

  it("refuses a fraction for a count, a wrong list length and a broken object", () => {
    expect(toFieldResult(fieldOf("stages"), { text: "1.5", unit: "-" }).problem).toBe(
      "Must be a whole number",
    );
    expect(toFieldResult(fieldOf("factors"), { text: "1", unit: null }).problem).toBe(
      "Must have 2 values",
    );
    expect(toFieldResult(fieldOf("composition"), { text: "{", unit: null }).problem).toBe(
      "Must be a JSON object",
    );
  });
});

describe("toFieldText", () => {
  it("writes numbers, lists and objects, and empty for no value", () => {
    expect(toFieldText(fieldOf("drop"), 1500)).toBe("1500");
    expect(toFieldText(fieldOf("lengths"), [1, 2])).toBe("1, 2");
    expect(toFieldText(fieldOf("composition"), { a: 1 })).toBe('{"a":1}');
    expect(toFieldText(fieldOf("drop"), null)).toBe("");
  });
});
