import { Fragment, useState } from "react";
import { Input } from "@/shared/ui/input";
import { labelOf } from "@/shared/forms/json-schema";
import { moduleDragType } from "./canvas";
import { toWords } from "@/shared/plant/spec";
import type { Palette } from "@/shared/api/types";

type Props = { items: Palette[]; onAdd: (type: string) => void };

const plantCategory = "plants";

function BreakableName({ name }: { name: string }) {
  return toWords(name).map((word, index) => (
    <Fragment key={`${word}-${String(index)}`}>
      {index === 0 ? null : <wbr />}
      {word}
    </Fragment>
  ));
}

function ModuleList({ items, onAdd }: Props) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {items.map((item) => (
        <li key={item.type}>
          <button
            type="button"
            draggable
            title={`${item.title}: ${item.summary}`}
            aria-label={`Add ${item.title}`}
            className="block w-full cursor-grab rounded-control border border-border bg-surface px-2 py-1 text-left [overflow-wrap:anywhere] hover:border-muted"
            onDragStart={(event) => {
              event.dataTransfer.setData(moduleDragType, item.type);
            }}
            onClick={() => {
              onAdd(item.type);
            }}
          >
            <BreakableName name={item.title} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function SubPlants({ items, onAdd, isOpen }: Props & { isOpen: boolean }) {
  if (items.length === 0) return null;
  return (
    <details open={isOpen} title="Each of these inserts a whole nested plant, not a single module">
      <summary className="mb-1 cursor-pointer text-[11px] font-medium tracking-wide text-muted uppercase">
        Sub-plants
      </summary>
      <ModuleList items={items} onAdd={onAdd} />
    </details>
  );
}

/** The module palette by gemini category with a filter, whole plants last and collapsed; drag onto the canvas or press Add. */
export function PalettePanel({ items, onAdd }: Props) {
  const [filter, setFilter] = useState("");
  const wanted = filter.trim().toLowerCase();
  const shown = items.filter(
    (item) => wanted === "" || `${item.title} ${item.summary}`.toLowerCase().includes(wanted),
  );
  const modules = shown.filter((item) => item.category !== plantCategory);
  const categories = [...new Set(modules.map((item) => item.category))];
  return (
    <section
      aria-label="Module palette"
      className="flex max-h-[max(520px,68vh)] flex-col gap-2 overflow-y-auto"
    >
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
          <ModuleList items={modules.filter((item) => item.category === category)} onAdd={onAdd} />
        </div>
      ))}
      <SubPlants
        items={shown.filter((item) => item.category === plantCategory)}
        onAdd={onAdd}
        isOpen={wanted !== ""}
      />
    </section>
  );
}
