import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { labelOf } from "@/shared/forms/json-schema";
import { moduleDragType } from "./canvas";
import type { PaletteItem } from "./types";

type Props = { items: PaletteItem[]; onAdd: (type: string) => void };

/** The module palette grouped by gemini category with a filter; drag onto the canvas or press Add. */
export function PalettePanel({ items, onAdd }: Props) {
  const [filter, setFilter] = useState("");
  const wanted = filter.trim().toLowerCase();
  const shown = items.filter(
    (item) => wanted === "" || `${item.title} ${item.summary}`.toLowerCase().includes(wanted),
  );
  const categories = [...new Set(shown.map((item) => item.category))];
  return (
    <section aria-label="Module palette" className="flex flex-col gap-2">
      <label htmlFor="palette-filter" className="text-[12.5px] text-muted">
        Filter modules
      </label>
      <Input
        id="palette-filter"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
        }}
      />
      {shown.length === 0 ? <p className="text-muted">No module matches.</p> : null}
      {categories.map((category) => (
        <div key={category}>
          <h3 className="mb-1 text-[11px] font-medium tracking-wide text-muted uppercase">
            {labelOf(category, {})}
          </h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {shown
              .filter((item) => item.category === category)
              .map((item) => (
                <li key={item.type}>
                  <button
                    type="button"
                    draggable
                    title={item.summary}
                    aria-label={`Add ${item.title}`}
                    className="w-full cursor-grab rounded-control border border-border bg-surface px-2 py-1 text-left hover:border-muted"
                    onDragStart={(event) => {
                      event.dataTransfer.setData(moduleDragType, item.type);
                    }}
                    onClick={() => {
                      onAdd(item.type);
                    }}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
