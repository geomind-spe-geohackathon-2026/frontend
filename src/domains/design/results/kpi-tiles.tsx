import { formatFigure } from "@/shared/quantity/figure";
import { Card, CardBody } from "@/shared/ui/card";
import type { Kpi } from "@/shared/api/types";

type Props = { items: Kpi[]; label: string };

/** A row of tiles, one per quantity: value and unit on separate lines; an absent value is muted with gemini's reason. */
export function KpiTiles({ items, label }: Props) {
  return (
    <ul
      aria-label={label}
      className="m-0 mb-3.5 grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-0"
    >
      {items.map((item) => (
        <li key={item.name} className="min-w-0">
          <Card>
            <CardBody>
              <div className="break-words text-[12.5px] text-muted">{item.title}</div>
              {item.value === null ? (
                <div className="text-muted">
                  <div className="text-[15px]">No value</div>
                  {item.reason === null ? null : (
                    <div className="break-words text-[12px]">{item.reason}</div>
                  )}
                </div>
              ) : (
                <div title={`${String(item.value)} ${item.unit}`}>
                  <div className="break-all text-[22px] font-semibold tabular-nums">
                    {formatFigure(item.value)}
                  </div>
                  <div className="break-words text-[12px] text-muted">{item.unit}</div>
                </div>
              )}
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
