import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useFieldContext } from "./field-context";
import { isRecord, labelOf, type JsonSchema } from "./json-schema";
import { ScalarControl } from "./scalar-control";

function useExtra(name: string): Record<string, unknown> {
  const { control } = useFormContext();
  const value: unknown = useWatch({ control, name });
  return isRecord(value) ? value : {};
}

function ExtraNumber({ name, label, title }: { name: string; label: string; title: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      {title}
      <ScalarControl
        id={name}
        name={name}
        schema={{ type: "number" }}
        invalid={false}
        describedBy={undefined}
        label={label}
      />
    </span>
  );
}

function toRangeBadge(range: Record<string, unknown>): string | null {
  const { min, max } = range;
  if (typeof min === "number" && typeof max === "number") {
    return `${String(min)} to ${String(max)}`;
  }
  if (typeof min === "number") return `from ${String(min)}`;
  return typeof max === "number" ? `to ${String(max)}` : null;
}

function toUncertaintyBadge(uncertainty: Record<string, unknown>): string | null {
  const { kind, std } = uncertainty;
  if (typeof kind !== "string") return null;
  if (typeof std === "number") return `${kind} σ ${String(std)}`;
  const spread = toRangeBadge(uncertainty);
  return spread === null ? kind : `${kind} ${spread}`;
}

function Toggle({
  title,
  hint,
  badge,
  children,
}: {
  title: string;
  hint: string;
  badge: string | null;
  children: ReactNode;
}) {
  return (
    <details className="min-w-0 text-[12px] text-muted">
      <summary className="cursor-pointer" title={hint}>
        {title}
        {badge === null ? null : (
          <span className="ml-1 rounded-pill border border-border px-1.5 tabular-nums">
            {badge}
          </span>
        )}
      </summary>
      <div className="mt-1 flex flex-col gap-1">{children}</div>
    </details>
  );
}

const rangeHint =
  "Kept with the value. No study reads a range on the case: Optimise searches the ranges on the plant.";
const uncertaintyHint =
  "Uncertainty and Sensitivity move this value: draws from this distribution, or its low and high end.";
const kinds: Record<string, string[]> = {
  uniform: ["min", "max"],
  triangular: ["min", "max"],
  normal: ["std"],
};

function RangeToggle({ name, label }: { name: string; label: string }) {
  const range = useExtra(`${name}.range`);
  return (
    <Toggle title="Range" hint={rangeHint} badge={toRangeBadge(range)}>
      <div className="grid grid-cols-2 gap-1">
        {["min", "max"].map((side) => (
          <ExtraNumber
            key={side}
            name={`${name}.range.${side}`}
            title={labelOf(side, {})}
            label={`${labelOf(side, {})} of the range of ${label}`}
          />
        ))}
      </div>
    </Toggle>
  );
}

function UncertaintyToggle({
  name,
  label,
  schema,
}: {
  name: string;
  label: string;
  schema: JsonSchema;
}) {
  const uncertainty = useExtra(`${name}.uncertainty`);
  const kind = typeof uncertainty.kind === "string" ? uncertainty.kind : "";
  return (
    <Toggle title="Uncertainty" hint={uncertaintyHint} badge={toUncertaintyBadge(uncertainty)}>
      <span className="flex flex-col gap-0.5">
        Distribution
        <ScalarControl
          id={`${name}.uncertainty.kind`}
          name={`${name}.uncertainty.kind`}
          schema={schema.properties?.kind ?? {}}
          invalid={false}
          describedBy={undefined}
          label={`Distribution of ${label}`}
          words
        />
      </span>
      <div className="grid grid-cols-2 gap-1">
        {(kinds[kind] ?? []).map((key) => (
          <ExtraNumber
            key={key}
            name={`${name}.uncertainty.${key}`}
            title={labelOf(key, {})}
            label={`${labelOf(key, {})} of ${label}`}
          />
        ))}
      </div>
    </Toggle>
  );
}

/** The Range and Uncertainty toggles of a value, with a badge of what is set. */
export function ValueExtras({
  name,
  label,
  schema,
}: {
  name: string;
  label: string;
  schema: JsonSchema;
}) {
  const { hideRange } = useFieldContext();
  const { range: rangeSchema, uncertainty } = schema.properties ?? {};
  const range = hideRange === true ? undefined : rangeSchema;
  if (range === undefined && uncertainty === undefined) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {range === undefined ? null : <RangeToggle name={name} label={label} />}
      {uncertainty === undefined ? null : (
        <UncertaintyToggle name={name} label={label} schema={uncertainty} />
      )}
    </div>
  );
}
