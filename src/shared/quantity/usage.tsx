import { cn } from "@/lib/cn";

const exact = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
const short = new Intl.NumberFormat("en", { maximumSignificantDigits: 3 });
const tenths = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
const nonBreakingSpace = " ";

/** Writes a token count short: exact below a thousand, then K and M with three significant digits ("90.6 K", "2.91 M"). */
export function formatTokens(value: number): string {
  const size = Math.abs(value);
  if (size >= 1e9) return `${short.format(value / 1e9)} B`;
  if (size >= 1e6) return `${short.format(value / 1e6)} M`;
  if (size >= 1e3) return `${short.format(value / 1e3)} K`;
  return exact.format(value);
}

/** Writes a duration in seconds as hours, minutes and seconds ("7 h 43 min 58 s", "4 min 12 s", "38 s", "5.5 s"). */
export function formatDuration(seconds: number): string {
  if (seconds < 10) return `${tenths.format(Math.max(0, seconds))} s`;
  const whole = Math.round(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  if (hours > 0) return `${String(hours)} h ${String(minutes)} min ${String(rest)} s`;
  if (minutes > 0) return `${String(minutes)} min ${String(rest)} s`;
  return `${String(rest)} s`;
}

/** A token count written short (K, M) with an optional muted unit; the exact count shows on hover. */
export function Tokens({
  value,
  unit = "",
  className,
}: {
  value: number;
  unit?: string;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn("tabular-nums", className)}
      title={`${exact.format(value)} ${unit.startsWith("tokens") ? unit : `tokens ${unit}`.trim()}`}
    >
      {formatTokens(value)}
      {unit === "" ? null : <span className="text-muted">{nonBreakingSpace + unit}</span>}
    </span>
  );
}

/** A duration written as h, min and s; the exact seconds show on hover. */
export function Duration({ seconds, className }: { seconds: number; className?: string | undefined }) {
  return (
    <span
      className={cn("tabular-nums", className)}
      title={`${new Intl.NumberFormat("en", { maximumFractionDigits: 3 }).format(seconds)} s`}
    >
      {formatDuration(seconds)}
    </span>
  );
}
