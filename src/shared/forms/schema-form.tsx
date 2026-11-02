import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { prune } from "./document";
import { fieldContext, type SeriesSource } from "./field-context";
import type { JsonSchema, Problem } from "./json-schema";
import { createSchemaResolver, formRoot, validateDocument } from "./resolver";
import { FieldNode } from "./schema-fields";

type Props = {
  schema: JsonSchema;
  initial: unknown;
  onChange: (value: unknown, problems: Problem[]) => void;
  prefix?: string;
  missing?: readonly string[];
  problems?: readonly Problem[];
  series?: SeriesSource | undefined;
  describeItem?: ((item: unknown) => string | null) | undefined;
};

/** A form generated from a JSON schema: units, missing marks, ajv checks; reports every change. */
export function SchemaForm({
  schema,
  initial,
  onChange,
  prefix = "",
  missing = [],
  problems = [],
  series,
  describeItem,
}: Props) {
  const resolver = useMemo(() => createSchemaResolver(schema), [schema]);
  const form = useForm({
    defaultValues: { [formRoot]: initial },
    resolver,
    mode: "onTouched",
  });
  const { subscribe } = form;
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => {
          const next = prune(values[formRoot]);
          onChange(next, validateDocument(schema, next));
        },
      }),
    [subscribe, onChange, schema],
  );
  const context = useMemo(
    () => ({ prefix, missing, problems, series, describeItem }),
    [prefix, missing, problems, series, describeItem],
  );
  return (
    <fieldContext.Provider value={context}>
      <FormProvider {...form}>
        <div>
          <FieldNode name={formRoot} path="" label="" schema={schema} />
        </div>
      </FormProvider>
    </fieldContext.Provider>
  );
}
