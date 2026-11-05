import { TriangleAlert } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { isFraction, isRecord, labelOf, type JsonSchema } from "./json-schema";
import { ScalarControl } from "./scalar-control";
import { ValueExtras } from "./value-extras";

type Props = { name: string; label: string; schema: JsonSchema };

const percent = 100;
const tolerance = 0.5;

/** Tells whether a group is a composition: only shares of one, more than one of them. */
export function isFractionGroup(schema: JsonSchema): boolean {
  const children = Object.values(schema.properties ?? {});
  return children.length > 1 && children.every(isFraction);
}

function isPercentUnit(unit: unknown): boolean {
  return typeof unit === "string" && unit.replaceAll(" ", "").endsWith("%");
}

function toScale(value: unknown): number {
  if (!isRecord(value)) return percent;
  const units = Object.values(value).flatMap((item) => (isRecord(item) ? [item.unit] : []));
  return units.some(isPercentUnit) ? 1 : percent;
}

function toTotal(value: unknown, scale: number): number | null {
  if (!isRecord(value)) return null;
  const shares = Object.values(value).flatMap((item) =>
    isRecord(item) && typeof item.value === "number" ? [item.value] : [],
  );
  return shares.length === 0 ? null : shares.reduce((sum, share) => sum + share, 0) * scale;
}

/** A composition as one table of mol %, with its total; uncertainty stays under Advanced. */
export function FractionGroup({ name, label, schema }: Props) {
  const { control } = useFormContext();
  const value: unknown = useWatch({ control, name });
  const scale = toScale(value);
  const total = toTotal(value, scale);
  const entries = Object.entries(schema.properties ?? {});
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-medium text-text">{label}</legend>
      <div className="ml-1.5 flex flex-col gap-2 border-l border-border pl-4">
        <div className="flex max-w-md flex-col gap-1.5">
          {entries.map(([key, child]) => (
            <div key={key} className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-2">
              <span className="text-[12.5px] text-muted">{labelOf(key, child)}</span>
              <ScalarControl
                id={`${name}.${key}`}
                name={`${name}.${key}.value`}
                schema={child.properties?.value ?? {}}
                invalid={false}
                describedBy={undefined}
                label={`${labelOf(key, child)} in mol %`}
                scale={scale}
              />
            </div>
          ))}
        </div>
        {total === null ? null : (
          <p className="inline-flex items-center gap-1 text-[12.5px] tabular-nums">
            Total {total.toFixed(1)} %
            {Math.abs(total - percent) <= tolerance ? null : (
              <span className="inline-flex items-center gap-1 text-warn">
                <TriangleAlert aria-hidden="true" className="size-3.5" />
                should be 100 %
              </span>
            )}
          </p>
        )}
        <details className="text-[12px] text-muted">
          <summary className="cursor-pointer">Advanced</summary>
          <div className="mt-1 flex flex-col gap-1">
            {entries.map(([key, child]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-16">{labelOf(key, child)}</span>
                <ValueExtras name={`${name}.${key}`} label={labelOf(key, child)} schema={child} />
              </div>
            ))}
          </div>
        </details>
      </div>
    </fieldset>
  );
}
