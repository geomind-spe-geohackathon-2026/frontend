import { labelOf } from "@/shared/forms/json-schema";
import { splitPort, type SpecConnection, type SpecModule } from "./spec";
import type { Layout } from "@/shared/api/layout";
import type { Palette } from "@/shared/api/types";

export const groupOrder = ["subsurface", "treatment", "heating", "cooling", "grids", "other"];

export type GroupFrame = {
  group: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Size = { width: number; height: number };

const framePadding = 28;
const frameHeader = 30;
const neighbourWeight = 2;

const groupByCategory: Record<string, string> = {
  subsurface: "subsurface",
  wells: "subsurface",
  treatment: "treatment",
  heating: "heating",
  cooling: "cooling",
  grids: "grids",
  environment: "grids",
};

const groupByStream: Record<string, string> = {
  brine: "treatment",
  hot_water: "heating",
  chilled_water: "cooling",
};

type Link = { neighbour: string; stream: string | null };

function toLinks(
  modules: SpecModule[],
  connections: SpecConnection[],
  streams: (string | null)[],
): Map<string, Link[]> {
  const links = new Map<string, Link[]>(modules.map((module) => [module.id, []]));
  connections.forEach((connection, index) => {
    const source = splitPort(connection.source).module;
    const target = splitPort(connection.target).module;
    const stream = streams[index] ?? null;
    links.get(source)?.push({ neighbour: target, stream });
    links.get(target)?.push({ neighbour: source, stream });
  });
  return links;
}

function toOwnGroup(category: string | undefined, links: Link[]): string | null {
  if (category === undefined) return null;
  if (links.some((link) => link.stream === "chilled_water")) return "cooling";
  if (category === "grids" && links.some((link) => link.stream === "hot_water")) return "heating";
  if (category === "plants" && links.some((link) => link.stream === "brine")) return "subsurface";
  return groupByCategory[category] ?? null;
}

function toVotedGroup(links: Link[], own: Map<string, string | null>): string {
  const votes = new Map<string, number>();
  const add = (group: string | null | undefined, weight: number) => {
    if (group === null || group === undefined || group === "grids") return;
    votes.set(group, (votes.get(group) ?? 0) + weight);
  };
  for (const link of links) {
    add(link.stream === null ? null : groupByStream[link.stream], 1);
    add(own.get(link.neighbour), neighbourWeight);
  }
  const ranked = [...votes].sort(
    ([first, a], [second, b]) => b - a || groupOrder.indexOf(first) - groupOrder.indexOf(second),
  );
  return ranked[0]?.[0] ?? "other";
}

/** Sorts modules into process groups: by gemini's category, else by the streams and neighbours around them. */
export function toModuleGroups(
  modules: SpecModule[],
  connections: SpecConnection[],
  streams: (string | null)[],
  palette: Palette[],
): Map<string, string> {
  const categories = new Map(palette.map((item) => [item.type, item.category]));
  const links = toLinks(modules, connections, streams);
  const own = new Map(
    modules.map((module) => [
      module.id,
      toOwnGroup(categories.get(module.type), links.get(module.id) ?? []),
    ]),
  );
  return new Map(
    modules.map((module) => [
      module.id,
      own.get(module.id) ?? toVotedGroup(links.get(module.id) ?? [], own),
    ]),
  );
}

/** Draws a frame around the modules of each group from their current positions, so frames follow a drag. */
export function toGroupFrames(
  groups: Map<string, string>,
  layout: Layout,
  sizeOf: (id: string) => Size,
): GroupFrame[] {
  return groupOrder.flatMap((group) => {
    const placed = [...groups]
      .filter(([, value]) => value === group)
      .flatMap(([id]) => {
        const at = layout[id];
        return at === undefined ? [] : [{ ...at, ...sizeOf(id) }];
      });
    if (placed.length === 0) return [];
    const left = Math.min(...placed.map((node) => node.x)) - framePadding;
    const top = Math.min(...placed.map((node) => node.y)) - framePadding - frameHeader;
    const right = Math.max(...placed.map((node) => node.x + node.width)) + framePadding;
    const bottom = Math.max(...placed.map((node) => node.y + node.height)) + framePadding;
    return [
      {
        group,
        label: labelOf(group, {}),
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      },
    ];
  });
}
