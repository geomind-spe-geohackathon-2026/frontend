import { lazy, Suspense, useState, type ComponentProps } from "react";
import { prune } from "./document";
import type { JsonSchema } from "./json-schema";
import { validateDocument } from "./resolver";
import { SchemaForm } from "./schema-form";

const JsonEditor = lazy(() =>
  import("./json-editor").then((module) => ({ default: module.JsonEditor })),
);

type Props = ComponentProps<typeof SchemaForm> & { jsonLabel: string };

function toText(value: unknown, schema: JsonSchema): string {
  if (value !== undefined) return JSON.stringify(value, null, 2);
  return schema.type === "array" ? "[]" : "{}";
}

function toParsed(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/** The one editor for a hand-made JSON config: the schema form as an indented tree, and below it the same JSON as editable text; each follows the other. */
export function ConfigEditor({ jsonLabel, ...form }: Props) {
  const { schema, initial, onChange } = form;
  const [shown, setShown] = useState(initial);
  const [text, setText] = useState(() => toText(initial, schema));
  const [generation, setGeneration] = useState(0);
  const [isBroken, setIsBroken] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <SchemaForm
        key={generation}
        {...form}
        initial={shown}
        onChange={(value, problems) => {
          if (JSON.stringify(value) === JSON.stringify(shown)) return;
          setShown(value);
          setText(toText(value, schema));
          setIsBroken(false);
          onChange(value, problems);
        }}
      />
      <section aria-label={jsonLabel} className="flex flex-col gap-1.5">
        <h3 className="text-[13px] font-medium">JSON</h3>
        <Suspense fallback={<pre className="text-[12.5px] text-muted">{text}</pre>}>
          <JsonEditor
            value={text}
            label={jsonLabel}
            onChange={(next) => {
              setText(next);
              const parsed = toParsed(next);
              setIsBroken(!parsed.ok);
              if (!parsed.ok) return;
              const value = prune(parsed.value);
              setShown(value);
              setGeneration((current) => current + 1);
              onChange(value, validateDocument(schema, value));
            }}
          />
        </Suspense>
        {isBroken ? (
          <p role="alert" className="text-[12.5px] text-warn">
            The JSON is not valid yet; the form keeps the last valid value.
          </p>
        ) : null}
      </section>
    </div>
  );
}
