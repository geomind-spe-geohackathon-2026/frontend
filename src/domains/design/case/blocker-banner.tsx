import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { labelOf, type JsonSchema } from "@/shared/forms/json-schema";
import type { MissingValue } from "@/shared/api/types";

type Props = {
  missing: MissingValue[];
  plantMissing: MissingValue[];
  hasPlant: boolean;
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

function MissingList({
  title,
  items,
  schema,
  onShow,
}: {
  title: string | null;
  items: MissingValue[];
  schema: JsonSchema;
  onShow: (path: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      {title === null ? null : <p className="text-[12.5px] text-muted">{title}</p>}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {items.map((item) => (
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
    </div>
  );
}

/** The warning card that lists every missing value with gemini's message and a link to its field. */
export function BlockerBanner({ missing, plantMissing, hasPlant, schema, onShow }: Props) {
  if (missing.length === 0 && plantMissing.length === 0) {
    return hasPlant ? null : (
      <p className="mb-3.5 text-muted">More values will be required once you choose a plant.</p>
    );
  }
  const count = missing.length + plantMissing.length;
  return (
    <Card className="mb-3.5 border-warn" role="region" aria-label="Missing values">
      <CardContent className="flex flex-col gap-2">
        <p className="font-medium">
          {count} {count === 1 ? "value" : "values"} missing
        </p>
        <p className="text-muted">Studies and results are blocked until these are filled.</p>
        <MissingList
          title={plantMissing.length === 0 ? null : "Needed by the case format"}
          items={missing}
          schema={schema}
          onShow={onShow}
        />
        <MissingList
          title="Needed by your plant"
          items={plantMissing}
          schema={schema}
          onShow={onShow}
        />
        {hasPlant ? null : (
          <p className="text-muted">More values will be required once you choose a plant.</p>
        )}
      </CardContent>
    </Card>
  );
}
