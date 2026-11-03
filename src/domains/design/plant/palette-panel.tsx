import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { labelOf } from "@/shared/forms/json-schema";
import { moduleDragType } from "./canvas";
import { toWords } from "@/shared/plant/spec";
import type { Palette } from "@/shared/api/types";

type Props = { items: Palette[]; onAdd: (type: string) => void };

const plantCategory = "plants";

function ModuleItems({ items, onAdd }: Props) {
  return items.map((item) => (
    <CommandItem
      key={item.type}
      value={item.type}
      keywords={[item.title, item.summary]}
      draggable
      title={`${item.title}: ${item.summary}`}
      aria-label={`Add ${item.title}`}
      className="cursor-grab [overflow-wrap:anywhere]"
      onDragStart={(event) => {
        event.dataTransfer.setData(moduleDragType, item.type);
      }}
      onSelect={() => {
        onAdd(item.type);
      }}
    >
      {toWords(item.title).join(" ")}
    </CommandItem>
  ));
}

/** The module palette by gemini category with a filter and keyboard choice, whole plants last; drag onto the canvas or pick one to add it. */
export function PalettePanel({ items, onAdd }: Props) {
  const modules = items.filter((item) => item.category !== plantCategory);
  const plants = items.filter((item) => item.category === plantCategory);
  const categories = [...new Set(modules.map((item) => item.category))];
  return (
    <Command
      label="Module palette"
      className="max-h-[max(520px,68vh)] bg-transparent [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase"
    >
      <CommandInput placeholder="Filter modules" aria-label="Filter modules" />
      <CommandList className="max-h-none">
        <CommandEmpty>No module matches.</CommandEmpty>
        {categories.map((category) => (
          <CommandGroup key={category} heading={labelOf(category, {})}>
            <ModuleItems
              items={modules.filter((item) => item.category === category)}
              onAdd={onAdd}
            />
          </CommandGroup>
        ))}
        {plants.length === 0 ? null : (
          <CommandGroup
            heading="Sub-plants"
            title="Each of these inserts a whole nested plant, not a single module"
          >
            <ModuleItems items={plants} onAdd={onAdd} />
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
