import { cn } from "@/lib/cn";

type Props = { value: number; unit: string; fractionDigits?: number; className?: string };

const nonBreakingSpace = " ";

/** Renders a number with its unit: tabular figures, the unit in muted text. */
export function Quantity({ value, unit, fractionDigits, className }: Props) {
  const text = new Intl.NumberFormat("en", {
    maximumFractionDigits: fractionDigits ?? 3,
  }).format(value);
  return (
    <span className={cn("tabular-nums", className)}>
      {text}
      {unit === "" ? null : <span className="text-muted">{nonBreakingSpace + unit}</span>}
    </span>
  );
}
