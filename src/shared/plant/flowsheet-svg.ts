import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import { toFanConnections, toLaidOutGraph } from "./auto-layout";
import { groupOrder, toGroupFrames, toModuleGroups, type GroupFrame } from "./groups";
import { splitPort, toWords } from "./spec";
import { toStreamLabel } from "./stream-colors";

export type SheetModule = { id: string; type: string; category: string };
export type SheetConnection = { source: string; target: string; stream: string | null };

const nodeWidth = 200;
const nodeHeight = 76;
const titleSize = 28;
const lineHeight = 31;
const maximumLine = 13;
const legendHeight = 60;
const sans = "Helvetica, Arial, sans-serif";
const ink = "#17212b";
const muted = "#5b6977";
const colours: Record<string, string> = {
  brine: "#d0542b",
  hot_water: "#e0912f",
  chilled_water: "#2f74c9",
  gas: "#7c8a96",
  fuel: "#7c8a96",
  electricity: "#7a5bc0",
};

function toColour(stream: string | null): string {
  return (stream === null ? undefined : colours[stream]) ?? muted;
}

function escapeText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Names a module in words; a short id such as d0 stays, after its type. */
export function toModuleTitle(module: SheetModule): string {
  if (module.id.length <= 3) return `${toWords(module.type).join(" ")} ${module.id}`;
  const words = module.id.replaceAll(".", " ").replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Breaks a title over at most two lines at a space. */
export function toTitleLines(title: string): string[] {
  if (title.length <= maximumLine) return [title];
  const words = title.split(" ");
  const first: string[] = [];
  while (words.length > 1 && [...first, words[0]].join(" ").length <= maximumLine) {
    first.push(words.shift() ?? "");
  }
  return first.length === 0 ? [title] : [first.join(" "), words.join(" ")];
}

function toGraph(
  modules: SheetModule[],
  connections: SheetConnection[],
  groups: Map<string, string>,
): ElkNode {
  const ids = new Set(modules.map((module) => module.id));
  const fans = toFanConnections(connections);
  const edges: ElkExtendedEdge[] = connections.flatMap((connection, index) => {
    const source = splitPort(connection.source).module;
    const target = splitPort(connection.target).module;
    if (fans.has(index) || source === target || !ids.has(source) || !ids.has(target)) return [];
    return [{ id: `c${String(index)}`, sources: [source], targets: [target] }];
  });
  return {
    id: "plant",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.partitioning.activate": "true",
      "elk.separateConnectedComponents": "false",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "42",
      "elk.layered.spacing.nodeNodeBetweenLayers": "56",
    },
    children: modules.map((module) => ({
      id: module.id,
      width: nodeWidth,
      height: nodeHeight,
      layoutOptions: {
        "elk.partitioning.partition": String(groupOrder.indexOf(groups.get(module.id) ?? "other")),
      },
    })),
    edges,
  };
}

function toEdgeSvg(edge: ElkExtendedEdge, connections: SheetConnection[]): string {
  const stream = connections[Number(edge.id.slice(1))]?.stream ?? null;
  return (edge.sections ?? [])
    .map((section) => {
      const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];
      const path = points.map((point) => `${String(point.x)},${String(point.y)}`).join(" ");
      return `<polyline points="${path}" fill="none" stroke="${toColour(stream)}" stroke-width="3"/>`;
    })
    .join("");
}

function toNodeSvg(node: ElkNode, title: string): string {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const lines = toTitleLines(title);
  const start = y + nodeHeight / 2 - ((lines.length - 1) * lineHeight) / 2 + titleSize / 3;
  const text = lines
    .map(
      (line, index) =>
        `<text x="${String(x + 12)}" y="${String(start + index * lineHeight)}" font-size="${String(titleSize)}" font-family="${sans}" fill="${ink}">${escapeText(line)}</text>`,
    )
    .join("");
  return `<rect x="${String(x)}" y="${String(y)}" width="${String(nodeWidth)}" height="${String(nodeHeight)}" rx="8" fill="#ffffff" stroke="${muted}" stroke-width="2"/>${text}`;
}

function toFrameSvg(frame: GroupFrame): string {
  return `<rect x="${String(frame.x)}" y="${String(frame.y)}" width="${String(frame.width)}" height="${String(frame.height)}" rx="10" fill="#f1f4f7"/><text x="${String(frame.x + 12)}" y="${String(frame.y + 26)}" font-size="24" font-family="${sans}" fill="${muted}">${escapeText(frame.label)}</text>`;
}

function toLegendSvg(streams: string[], x: number, y: number): string {
  return streams
    .map((stream, index) => {
      const left = x + index * 260;
      return `<rect x="${String(left)}" y="${String(y)}" width="44" height="8" fill="${toColour(stream)}"/><text x="${String(left + 54)}" y="${String(y + 12)}" font-size="26" font-family="${sans}" fill="${muted}">${escapeText(toStreamLabel(stream))}</text>`;
    })
    .join("");
}

/** Draws a plant as an SVG picture: the editor's layered layout, groups, titles and stream colours. */
export async function toFlowsheetSvg(
  modules: SheetModule[],
  connections: SheetConnection[],
): Promise<string> {
  const streams = connections.map((connection) => connection.stream);
  const palette = modules.map((module) => ({ ...module, title: module.type, summary: "" }));
  const groups = toModuleGroups(modules, connections, streams, palette);
  const graph = await toLaidOutGraph(toGraph(modules, connections, groups));
  const children = graph.children ?? [];
  const layout = Object.fromEntries(
    children.map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]),
  );
  const frames = toGroupFrames(groups, layout, () => ({ width: nodeWidth, height: nodeHeight }));
  const left = Math.min(...frames.map((frame) => frame.x)) - 8;
  const top = Math.min(...frames.map((frame) => frame.y)) - 8;
  const right = Math.max(...frames.map((frame) => frame.x + frame.width)) + 8;
  const bottom = Math.max(...frames.map((frame) => frame.y + frame.height)) + 8;
  const titles = new Map(modules.map((module) => [module.id, toModuleTitle(module)]));
  const shown = (graph.edges ?? []).map((edge) => connections[Number(edge.id.slice(1))]?.stream);
  const legend = [...new Set(shown.filter((stream) => typeof stream === "string"))];
  const body = [
    `<rect x="${String(left)}" y="${String(top)}" width="${String(right - left)}" height="${String(bottom - top + legendHeight)}" fill="#ffffff"/>`,
    ...frames.map(toFrameSvg),
    ...(graph.edges ?? []).map((edge) => toEdgeSvg(edge, connections)),
    ...children.map((child) => toNodeSvg(child, titles.get(child.id) ?? child.id)),
    toLegendSvg(legend, left + 8, bottom + 18),
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${String(left)} ${String(top)} ${String(right - left)} ${String(bottom - top + legendHeight)}">${body.join("")}</svg>`;
}
