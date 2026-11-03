import { useQuery } from "@tanstack/react-query";
import { resultQuery } from "@/domains/design/results/api";
import { toModuleName } from "@/domains/design/results/names";
import { resultsQuery } from "@/shared/api/results";
import type { Capacity } from "@/shared/api/types";
import { formatFigure } from "@/shared/quantity/figure";

type Props = { projectId: string; onModule: (id: string) => void };

function toLabel(item: Capacity): string {
  const value = item.value === null ? "no value" : `${formatFigure(item.value)} ${item.unit}`;
  if (item.share === null) return `${value}, not used`;
  return `${value}, ${(item.share * 100).toFixed(0)}% used`;
}

function Chips({
  projectId,
  resultId,
  name,
  onModule,
}: Props & { resultId: string; name: string }) {
  const result = useQuery(resultQuery(projectId, resultId));
  const items = result.data?.capacities ?? [];
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Module results"
      className="flex min-w-0 items-center gap-2 overflow-x-auto rounded-card border border-border bg-surface px-3 py-1.5"
    >
      <span className="shrink-0 text-[12px] text-muted">{name}</span>
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          onClick={() => {
            onModule(item.title);
          }}
          className="shrink-0 rounded-control border border-border bg-sunken px-2 py-0.5 text-[12px] hover:border-accent"
        >
          <span className="font-medium">{toModuleName(item.title)}</span>{" "}
          <span className="tabular-nums text-muted">{toLabel(item)}</span>
        </button>
      ))}
    </section>
  );
}

/** The key result of each module from the newest result; a click selects the module on the canvas. */
export function ModuleResults({ projectId, onModule }: Props) {
  const results = useQuery(resultsQuery(projectId));
  const newest = results.data?.[0];
  if (newest === undefined) return null;
  return (
    <Chips projectId={projectId} resultId={newest.id} name={newest.name} onModule={onModule} />
  );
}
