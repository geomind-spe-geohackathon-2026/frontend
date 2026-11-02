import type { JsonSchema } from "@/shared/forms/json-schema";
import type { CaseContent } from "./types";

/** Builds the header of an empty problem from the schema's constant properties and the project name. */
export function toEmptyCase(schema: JsonSchema, name: string): CaseContent {
  const content: CaseContent = {};
  for (const [key, child] of Object.entries(schema.properties ?? {})) {
    if (child.const !== undefined) content[key] = child.const;
  }
  content.name = name;
  return content;
}
