type Props = { value: number | null; max: number; label: string };

/** A progress bar; a null value draws an indeterminate bar that claims no percentage. */
export function ProgressBar({ value, max, label }: Props) {
  if (value === null) {
    return (
      <div
        role="progressbar"
        aria-label={label}
        className="h-1.5 w-28 overflow-hidden rounded-pill bg-sunken"
      >
        <div className="h-full w-1/3 rounded-pill bg-accent motion-safe:animate-pulse" />
      </div>
    );
  }
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1.5 w-28 overflow-hidden rounded-pill bg-sunken"
    >
      <div className="h-full rounded-pill bg-accent" style={{ width: `${String(percent)}%` }} />
    </div>
  );
}
