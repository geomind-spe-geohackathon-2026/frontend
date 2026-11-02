import { cn } from "@/lib/cn";
import { toStreamColor, toStreamDash, toStreamLabel } from "./stream-colors";

type Props = {
  streams: string[];
  hidden: Set<string>;
  onToggle: (stream: string) => void;
};

/** The colour of each stream kind on the canvas; pressing one hides or shows its connections. */
export function StreamLegend({ streams, hidden, onToggle }: Props) {
  if (streams.length === 0) return null;
  return (
    <ul aria-label="Stream kinds" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {streams.map((stream) => {
        const isShown = !hidden.has(stream);
        return (
          <li key={stream}>
            <button
              type="button"
              aria-pressed={isShown}
              title={isShown ? "Hide these connections" : "Show these connections"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-2 py-0.5 text-[12px]",
                !isShown && "text-muted line-through",
              )}
              onClick={() => {
                onToggle(stream);
              }}
            >
              <svg width="22" height="6" aria-hidden="true">
                <line
                  x1="0"
                  y1="3"
                  x2="22"
                  y2="3"
                  strokeWidth="3"
                  stroke={toStreamColor(stream)}
                  strokeDasharray={toStreamDash(stream)}
                />
              </svg>
              {toStreamLabel(stream)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
