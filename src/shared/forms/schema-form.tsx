import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { prune } from "./document";
import { fieldContext, toFullPath } from "./field-context";
import type { JsonSchema, Problem } from "./json-schema";
import { findMissing } from "./missing";
import { createSchemaResolver, formRoot, validateDocument } from "./resolver";
import { FieldNode } from "./schema-fields";

type Props = {
  schema: JsonSchema;
  initial: unknown;
  onChange: (value: unknown, problems: Problem[]) => void;
  prefix?: string;
  missing?: readonly string[];
  problems?: readonly Problem[];
};

/** A form generated from a JSON schema: units, missing marks, ajv checks; reports every change. */
export function SchemaForm({
  schema,
  initial,
  onChange,
  prefix = "",
  missing = [],
  problems = [],
}: Props) {
  const resolver = useMemo(() => createSchemaResolver(schema), [schema]);
  const form = useForm({
    defaultValues: { [formRoot]: initial },
    resolver,
    mode: "onTouched",
  });
  const [current, setCurrent] = useState(initial);
  const { subscribe } = form;
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => {
          const next = prune(values[formRoot]);
          setCurrent(next);
          onChange(next, validateDocument(schema, next));
        },
      }),
    [subscribe, onChange, schema],
  );
  const known = useMemo(
    () => [...missing, ...findMissing(schema, current).map((path) => toFullPath(prefix, path))],
    [missing, schema, current, prefix],
  );
  const context = useMemo(() => ({ prefix, missing: known, problems }), [prefix, known, problems]);
  return (
    <fieldContext.Provider value={context}>
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FieldNode name={formRoot} path="" label="" schema={schema} />
        </form>
      </FormProvider>
    </fieldContext.Provider>
  );
}
