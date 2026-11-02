import { Missing } from "@/shared/quantity/missing";
import { Card, CardBody } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { labelOf, type JsonSchema } from "@/shared/forms/json-schema";
import type { MissingValue } from "@/shared/api/types";

type Props = {
  missing: MissingValue[];
  schema: JsonSchema;
  onShow: (path: string) => void;
};

function nodeAt(schema: JsonSchema, parts: string[]): JsonSchema | undefined {
  return parts.reduce<JsonSchema | undefined>((node, part) => node?.properties?.[part], schema);
}

/** Writes a missing path in words: Time: start, end, step missing. */
export function toMissingText(path: string, schema: JsonSchema): string {
  const parts = path.split(".");
  const title = parts.map((part) => labelOf(part, {})).join(" › ");
  const required = nodeAt(schema, parts)?.required ?? [];
  const names = required.map((name) => name.replaceAll("_", " ")).join(", ");
  return names === "" ? `${title}: missing` : `${title}: ${names} missing`;
}

/** The warning card that lists every missing value with gemini's message and a link to its field. */
export function BlockerBanner({ missing, schema, onShow }: Props) {
  if (missing.length === 0) return null;
  return (
    <Card className="mb-3.5 border-warn" role="region" aria-label="Missing values">
      <CardBody className="flex flex-col gap-2">
        <p className="font-medium">
          {missing.length} {missing.length === 1 ? "value" : "values"} missing
        </p>
        <Missing blocks="studies and results" />
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {missing.map((item) => (
            <li key={item.path}>
              <Button
                variant="link"
                onClick={() => {
                  onShow(item.path);
                }}
              >
                {toMissingText(item.path, schema)}
              </Button>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
