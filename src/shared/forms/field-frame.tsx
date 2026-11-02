import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { getAt } from "./document";
import { toFieldId, toFullPath, useFieldContext } from "./field-context";
import { isRecord } from "./json-schema";

type Props = {
  name: string;
  path: string;
  label: string;
  unit?: string | undefined;
  children: (props: { id: string; invalid: boolean; describedBy: string | undefined }) => ReactNode;
};

function isEmpty(value: unknown): boolean {
  if (isRecord(value)) return value.value === undefined && value.file === undefined;
  return value === undefined || value === "";
}

/** Tells whether gemini reported a missing value at this field or inside it. */
export function isReported(missing: readonly string[], full: string): boolean {
  return missing.some((path) => path === full || path.startsWith(`${full}.`));
}

function useMessages(name: string, full: string): string[] {
  const { problems } = useFieldContext();
  const { formState } = useFormContext();
  const own: unknown = getAt(formState.errors, name);
  const fromForm = isRecord(own) && typeof own.message === "string" ? [own.message] : [];
  const fromServer = problems
    .filter((problem) => problem.path === full || problem.path.startsWith(`${full}.`))
    .map((problem) => problem.message);
  return [...fromForm, ...fromServer];
}

/** Label, control, unit, missing mark and messages of one field; the control comes from the render prop. */
export function FieldFrame({ name, path, label, unit, children }: Props) {
  const { prefix, missing } = useFieldContext();
  const { control } = useFormContext();
  const current: unknown = useWatch({ control, name });
  const full = toFullPath(prefix, path);
  const id = toFieldId(full);
  const messages = useMessages(name, full);
  const isMissing = isReported(missing, full) && isEmpty(current);
  const invalid = isMissing || messages.length > 0;
  const describedBy = invalid ? `${id}-notes` : undefined;
  return (
    <div className="flex flex-col gap-1" data-missing={isMissing}>
      <label htmlFor={id} className="text-[12.5px] text-muted">
        {label}
        {unit === undefined || unit === "" ? null : <span className="ml-1">[{unit}]</span>}
      </label>
      {children({ id, invalid, describedBy })}
      {invalid ? (
        <div id={`${id}-notes`} className="flex flex-col gap-0.5 text-[12px]">
          {isMissing ? (
            <span className="inline-flex items-center gap-1 text-warn">
              <TriangleAlert aria-hidden="true" className="size-3.5" />
              missing
            </span>
          ) : null}
          {messages.map((message) => (
            <span key={message} className="text-bad">
              {message}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
