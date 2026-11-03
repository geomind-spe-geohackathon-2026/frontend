import { Progress } from "@/components/ui/progress";

type Props = { value: number | null; max: number; label: string };

/** A progress bar (shadcn Progress) in percent; a null value draws an indeterminate bar that claims no percentage. */
export function ProgressBar({ value, max, label }: Props) {
  if (value === null) {
    return (
      <Progress
        aria-label={label}
        value={null}
        className="h-1.5 w-28 bg-sunken motion-safe:animate-pulse [&>[data-slot=progress-indicator]]:w-1/3 [&>[data-slot=progress-indicator]]:[transform:none]!"
      />
    );
  }
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <Progress aria-label={label} value={percent} className="h-1.5 w-28 bg-sunken" />;
}
