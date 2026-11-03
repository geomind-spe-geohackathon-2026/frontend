import { formatFigure, humanise } from "@/shared/quantity/figure";
import { Card, CardBody } from "@/shared/ui/card";
import type { Capacity } from "@/shared/api/types";
import { toModuleName } from "./names";

type Props = { items: Capacity[]; label: string };

function toUse(item: Capacity): string {
  if (item.peak === null || item.share === null) return "not used in this run";
  const share = `${(item.share * 100).toFixed(0)}% of the rating`;
  return `peak ${formatFigure(item.peak)} ${item.peak_unit}, ${share}`;
}

/** One tile per rated module: its name and kind, the rating, and how much of it the run used. */
export function CapacityTiles({ items, label }: Props) {
  return (
    <section aria-label={label} className="mb-3.5">
      <h2 className="mb-2 text-[13px] text-muted">{label}</h2>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-0">
        {items.map((item) => (
          <li key={item.name} className="min-w-0">
            <Card>
              <CardBody>
                <div className="font-medium break-words">{toModuleName(item.title)}</div>
                {item.kind === humanise(item.title) ? null : (
                  <div className="text-[12px] text-muted">{item.kind}</div>
                )}
                <div className="mt-1 text-[20px] font-semibold tabular-nums">
                  {item.value === null ? "No value" : formatFigure(item.value)}{" "}
                  <span className="text-[12px] font-normal text-muted">{item.unit}</span>
                </div>
                <div className="text-[12px] text-muted">{toUse(item)}</div>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
