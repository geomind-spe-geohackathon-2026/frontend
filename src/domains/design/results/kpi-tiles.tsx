import { Missing } from "@/shared/quantity/missing";
import { Quantity } from "@/shared/quantity/quantity";
import { Card, CardBody } from "@/shared/ui/card";
import type { Kpi } from "@/shared/api/types";

type Props = { items: Kpi[]; label: string };

/** A row of tiles, one per quantity, with its unit; an absent value is marked missing. */
export function KpiTiles({ items, label }: Props) {
  return (
    <ul
      aria-label={label}
      className="m-0 mb-3.5 grid list-none grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 p-0"
    >
      {items.map((item) => (
        <li key={item.name}>
          <Card>
            <CardBody>
              <div className="text-[12.5px] text-muted">{item.title}</div>
              <div className="text-[22px] font-semibold">
                {item.value === null ? (
                  <Missing blocks={item.title} />
                ) : (
                  <Quantity value={item.value} unit={item.unit} />
                )}
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
