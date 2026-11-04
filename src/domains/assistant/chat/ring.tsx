const radius = 6;
const around = 2 * Math.PI * radius;

/** A small circle that fills with the share used; empty while the share is unknown. */
export function Ring({ share }: { share: number | null }) {
  const filled = share === null ? 0 : Math.min(Math.max(share, 0), 1);
  return (
    <svg viewBox="0 0 16 16" className="size-4 -rotate-90" aria-hidden="true">
      <circle cx="8" cy="8" r={radius} fill="none" strokeWidth="2" className="stroke-border" />
      <circle
        cx="8"
        cy="8"
        r={radius}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={around}
        strokeDashoffset={around * (1 - filled)}
        className="stroke-muted-foreground transition-[stroke-dashoffset]"
      />
    </svg>
  );
}
