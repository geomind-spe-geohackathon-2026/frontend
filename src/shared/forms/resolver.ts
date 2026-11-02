import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject, ValidateFunction } from "ajv";
import { set, type FieldErrors, type Resolver } from "react-hook-form";
import { toDotted } from "./document";
import type { JsonSchema, Problem } from "./json-schema";

export const formRoot = "v";

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: false,
  validateSchema: false,
});
const compiled = new WeakMap<JsonSchema, ValidateFunction>();

function validatorOf(schema: JsonSchema): ValidateFunction {
  const cached = compiled.get(schema);
  if (cached !== undefined) return cached;
  const created = ajv.compile(schema);
  compiled.set(schema, created);
  return created;
}

function toPath(error: ErrorObject): string {
  return error.instancePath.split("/").slice(1).join(".");
}

/** Checks a value against a schema with ajv; required properties are missing values, not problems. */
export function validateDocument(schema: JsonSchema, value: unknown): Problem[] {
  const validate = validatorOf(schema);
  if (validate(value)) return [];
  return (validate.errors ?? [])
    .filter((error) => error.keyword !== "required")
    .map((error) => ({
      path: toPath(error),
      message: error.message ?? "invalid",
      code: error.keyword,
    }));
}

function toTree(problems: Problem[]): FieldErrors {
  const tree: FieldErrors = {};
  for (const problem of problems) {
    const steps = [
      formRoot,
      ...toDotted(problem.path)
        .split(".")
        .filter((step) => step !== ""),
    ];
    set(tree, steps.join("."), { type: problem.code ?? "invalid", message: problem.message });
  }
  return tree;
}

/** Builds the react-hook-form resolver for a schema; the form value sits under the key "v". */
export function createSchemaResolver(schema: JsonSchema): Resolver {
  return (values) => {
    const problems = validateDocument(schema, values[formRoot]);
    if (problems.length === 0) return { values, errors: {} };
    return { values: {}, errors: toTree(problems) };
  };
}
