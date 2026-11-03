import type { ElkExtendedEdge, ElkNode, ElkPort } from "elkjs/lib/elk-api";
import { toLaidOutGraph } from "./auto-layout";
import { groupOrder, type GroupFrame } from "./groups";
import { labelOf } from "@/shared/forms/json-schema";
import type { Sheet, SheetEdge, SheetNode } from "./flowsheet-sheet";

export type SheetPoint = { x: number; y: number };
export type SheetLine = { stream: string | null; points: SheetPoint[]; arrow: boolean };
export type PlacedNode = SheetNode & SheetPoint;
export type SheetPicture = {
  frames: GroupFrame[];
  nodes: PlacedNode[];
  lines: SheetLine[];
  width: number;
  height: number;
};

export const sheetNodeWidth = 92;
export const sheetNodeHeight = 40;

const groupGap = 20;
const wrappedOrder = ["subsurface", "treatment", "grids", "heating", "cooling", "other"];
const jogGap = 6;
const jogMargin = 3;
const largeLane = 1e6;
const trackGap = 9;
const gutterPadding = 14;
const groupGraphOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.separateConnectedComponents": "false",
  "elk.portConstraints": "FIXED_SIDE",
  "elk.padding": "[top=28,left=8,bottom=12,right=8]",
  "elk.spacing.nodeNode": "14",
  "elk.spacing.edgeNode": "10",
  "elk.spacing.edgeEdge": "7",
  "elk.layered.spacing.nodeNodeBetweenLayers": "20",
  "elk.layered.spacing.edgeNodeBetweenLayers": "10",
};

type Side = "NORTH" | "EAST" | "SOUTH" | "WEST";
type Link = { source: string; target: string; stream: string | null; beside: boolean };
type Part = { ports: ElkPort[]; edges: ElkExtendedEdge[] };
type Plan = { parts: Map<string, Part>; links: Link[]; streams: Map<string, string | null> };
type Box = { group: string; graph: ElkNode; x: number; y: number; width: number; height: number };

function toPart(plan: Plan, group: string): Part {
  const part = plan.parts.get(group) ?? { ports: [], edges: [] };
  plan.parts.set(group, part);
  return part;
}

function toGroupGraph(sheet: Sheet, group: string, part: Part): ElkNode {
  return {
    id: group,
    layoutOptions: groupGraphOptions,
    children: sheet.nodes
      .filter((node) => node.group === group)
      .map((node) => ({ id: node.id, width: sheetNodeWidth, height: sheetNodeHeight })),
    ports: part.ports,
    edges: part.edges,
  };
}

async function toLaidOutGroup(graph: ElkNode): Promise<ElkNode> {
  const root = { id: "sheet", layoutOptions: { "elk.algorithm": "layered" }, children: [graph] };
  return (await toLaidOutGraph(root)).children?.[0] ?? graph;
}

function toWidth(graph: ElkNode): number {
  return graph.width ?? 0;
}

function toRowWidth(graphs: ElkNode[]): number {
  return graphs.reduce((sum, graph) => sum + toWidth(graph), 0) + groupGap * (graphs.length - 1);
}

function toRows(groups: string[], graphs: ElkNode[], limit: number): string[][] {
  if (toRowWidth(graphs) <= limit) return [groups];
  const order = wrappedOrder.filter((group) => groups.includes(group));
  const ordered = order.flatMap((group) => graphs[groups.indexOf(group)] ?? []);
  const splits = order.slice(1).map((_, index) => index + 1);
  const size = (cut: number) =>
    Math.max(toRowWidth(ordered.slice(0, cut)), toRowWidth(ordered.slice(cut)));
  const best = splits.reduce((first, cut) => (size(cut) < size(first) ? cut : first), 1);
  return [order.slice(0, best), order.slice(best)];
}

function toSides(from: string, to: string, rows: string[][]): [Side, Side, boolean] {
  const rowOf = (group: string) => rows.findIndex((row) => row.includes(group));
  const row = rowOf(from);
  const distance = (rows[row] ?? []).indexOf(to) - (rows[row] ?? []).indexOf(from);
  if (rowOf(to) === row && distance === 1) return ["EAST", "WEST", true];
  if (rowOf(to) === row && distance === -1) return ["WEST", "EAST", true];
  const outer = row === 0 ? "SOUTH" : "NORTH";
  const inner = rowOf(to) === 0 ? "SOUTH" : "NORTH";
  return [outer, inner, false];
}

function addPort(part: Part, id: string, side: Side, edge: ElkExtendedEdge): boolean {
  if (part.ports.some((port) => port.id === id)) return false;
  part.ports.push({
    id,
    width: 0,
    height: 0,
    layoutOptions: { "elk.port.side": side },
  });
  part.edges.push(edge);
  return true;
}

function addCrossing(
  plan: Plan,
  edge: SheetEdge,
  index: number,
  ends: [string, string],
  rows: string[][],
) {
  const [from, to] = ends;
  const [sourceSide, targetSide, beside] = toSides(from, to, rows);
  const stream = String(edge.stream);
  const source = `${edge.source}~${stream}~${sourceSide}`;
  const target = `${edge.target}~${stream}~${targetSide}`;
  const outId = `o${String(index)}`;
  const inId = `i${String(index)}`;
  plan.streams.set(outId, edge.stream);
  plan.streams.set(inId, edge.stream);
  addPort(toPart(plan, from), source, sourceSide, {
    id: outId,
    sources: [edge.source],
    targets: [source],
  });
  addPort(toPart(plan, to), target, targetSide, {
    id: inId,
    sources: [target],
    targets: [edge.target],
  });
  plan.links.push({ source, target, stream: edge.stream, beside });
}

function toPlan(sheet: Sheet, rows: string[][]): Plan {
  const plan: Plan = { parts: new Map(), links: [], streams: new Map() };
  const groupOf = new Map(sheet.nodes.map((node) => [node.id, node.group]));
  sheet.edges.forEach((edge, index) => {
    const from = groupOf.get(edge.source);
    const to = groupOf.get(edge.target);
    if (from === undefined || to === undefined) return;
    if (from !== to) {
      addCrossing(plan, edge, index, [from, to], rows);
      return;
    }
    const id = `e${String(index)}`;
    plan.streams.set(id, edge.stream);
    toPart(plan, from).edges.push({ id, sources: [edge.source], targets: [edge.target] });
  });
  return plan;
}

function toBoxes(rows: string[][], graphs: Map<string, ElkNode>): { boxes: Box[]; width: number } {
  const lists = rows.map((row) => row.flatMap((group) => graphs.get(group) ?? []));
  const width = Math.max(...lists.map(toRowWidth));
  const boxes = rows.flatMap((row, rowIndex) => {
    const list = lists[rowIndex] ?? [];
    const stretch =
      (width - groupGap * (list.length - 1)) / (toRowWidth(list) - groupGap * (list.length - 1));
    const tallest = Math.max(...list.map((graph) => graph.height ?? 0));
    let x = 0;
    return row.flatMap((group, index) => {
      const graph = list[index];
      if (graph === undefined) return [];
      const box = {
        group,
        graph,
        x,
        y: rowIndex,
        width: toWidth(graph) * stretch,
        height: tallest,
      };
      x += box.width + groupGap;
      return [box];
    });
  });
  return { boxes, width };
}

function toPortMap(boxes: Box[], yOf: (box: Box) => number): Map<string, SheetPoint> {
  return new Map(
    boxes.flatMap((box) =>
      (box.graph.ports ?? []).map((port) => [
        port.id,
        {
          x: box.x + (box.width - toWidth(box.graph)) / 2 + (port.x ?? 0),
          y: yOf(box) + (box.height - (box.graph.height ?? 0)) / 2 + (port.y ?? 0),
        },
      ]),
    ),
  );
}

function isUpperPort(id: string): boolean {
  return id.endsWith("SOUTH");
}

function toSpan(link: Link, xOf: (id: string) => number): [number, number] {
  const [left = 0, right = 0] = [xOf(link.source), xOf(link.target)].sort((a, b) => a - b);
  return [left, right];
}

function isOver(upper: Link, lower: Link, xOf: (id: string) => number): boolean {
  const [left, right] = toSpan(lower, xOf);
  const isInside = (id: string) => xOf(id) > left && xOf(id) < right;
  const hits = [upper.source, upper.target].filter(isInside).some(isUpperPort);
  const [leftOfUpper, rightOfUpper] = toSpan(upper, xOf);
  const isInUpper = (id: string) => xOf(id) > leftOfUpper && xOf(id) < rightOfUpper;
  const pressed = [lower.source, lower.target].filter(isInUpper).some((id) => !isUpperPort(id));
  return hits || pressed;
}

function isFree(tracks: Map<Link, number>, link: Link, track: number, xOf: (id: string) => number) {
  const [left, right] = toSpan(link, xOf);
  return [...tracks].every(([other, used]) => {
    const [otherLeft, otherRight] = toSpan(other, xOf);
    return used !== track || otherRight + trackGap < left || right + trackGap < otherLeft;
  });
}

function toTracks(links: Link[], xOf: (id: string) => number): Map<Link, number> {
  const ranks = new Map(links.map((link) => [link, 0]));
  const rankOf = (link: Link) => ranks.get(link) ?? 0;
  links.forEach(() => {
    for (const upper of links) {
      for (const lower of links) {
        if (upper !== lower && isOver(upper, lower, xOf) && !isOver(lower, upper, xOf)) {
          ranks.set(lower, Math.max(rankOf(lower), rankOf(upper) + 1));
        }
      }
    }
  });
  const tracks = new Map<Link, number>();
  const sorted = [...links].sort(
    (first, second) =>
      rankOf(first) - rankOf(second) || toSpan(first, xOf)[0] - toSpan(second, xOf)[0],
  );
  for (const link of sorted) {
    let track = rankOf(link);
    while (!isFree(tracks, link, track, xOf)) track += 1;
    tracks.set(link, track);
  }
  return tracks;
}

function toBesideLine(link: Link, ports: Map<string, SheetPoint>, x: number): SheetLine | null {
  const start = ports.get(link.source);
  const end = ports.get(link.target);
  if (start === undefined || end === undefined) return null;
  const points = [start, { x, y: start.y }, { x, y: end.y }, end];
  return { stream: link.stream, points, arrow: false };
}

function toGutterLine(link: Link, ports: Map<string, SheetPoint>, y: number): SheetLine | null {
  const start = ports.get(link.source);
  const end = ports.get(link.target);
  if (start === undefined || end === undefined) return null;
  const points = [start, { x: start.x, y }, { x: end.x, y }, end];
  return { stream: link.stream, points, arrow: false };
}

function toGapOf(link: Link, ports: Map<string, SheetPoint>, boxes: Box[]): number {
  const left = Math.min(ports.get(link.source)?.x ?? 0, ports.get(link.target)?.x ?? 0);
  const box = boxes.find((item) => left >= item.x && left <= item.x + item.width);
  return (box?.x ?? 0) + (box?.width ?? 0);
}

function toFall(link: Link, ports: Map<string, SheetPoint>): number {
  return (ports.get(link.target)?.y ?? 0) - (ports.get(link.source)?.y ?? 0);
}

function toLaneOrder(links: Link[], ports: Map<string, SheetPoint>): Link[] {
  const startOf = (link: Link) => ports.get(link.source)?.y ?? 0;
  const toLane = (link: Link) => {
    const fall = toFall(link, ports);
    return fall >= 0 ? -startOf(link) : startOf(link) + largeLane;
  };
  return [...links].sort((first, second) => toLane(first) - toLane(second));
}

function toJogs(links: Link[], ports: Map<string, SheetPoint>, boxes: Box[]): Map<Link, number> {
  const gaps = new Map<number, Link[]>();
  for (const link of links) {
    const gap = toGapOf(link, ports, boxes);
    gaps.set(gap, [...(gaps.get(gap) ?? []), link]);
  }
  const jogs = new Map<Link, number>();
  for (const [gap, inGap] of gaps) {
    const step = Math.min(jogGap, (groupGap - 2 * jogMargin) / Math.max(1, inGap.length - 1));
    const start = gap + groupGap / 2 - (step * (inGap.length - 1)) / 2;
    toLaneOrder(inGap, ports).forEach((link, index) => {
      jogs.set(link, start + index * step);
    });
  }
  return jogs;
}

function toInnerLines(boxes: Box[], yOf: (box: Box) => number, plan: Plan): SheetLine[] {
  return boxes.flatMap((box) => {
    const left = box.x + (box.width - toWidth(box.graph)) / 2;
    const top = yOf(box) + (box.height - (box.graph.height ?? 0)) / 2;
    return (box.graph.edges ?? []).flatMap((edge) =>
      (edge.sections ?? []).map((section) => ({
        stream: plan.streams.get(edge.id) ?? null,
        arrow: !edge.id.startsWith("o"),
        points: [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map(
          (point) => ({ x: left + point.x, y: top + point.y }),
        ),
      })),
    );
  });
}

function toPlacedNodes(sheet: Sheet, boxes: Box[], yOf: (box: Box) => number): PlacedNode[] {
  return boxes.flatMap((box) => {
    const left = box.x + (box.width - toWidth(box.graph)) / 2;
    const top = yOf(box) + (box.height - (box.graph.height ?? 0)) / 2;
    return (box.graph.children ?? []).flatMap((child) => {
      const node = sheet.nodes.find((item) => item.id === child.id);
      if (node === undefined) return [];
      return [{ ...node, x: left + (child.x ?? 0), y: top + (child.y ?? 0) }];
    });
  });
}

function toPicture(
  sheet: Sheet,
  rows: string[][],
  graphs: Map<string, ElkNode>,
  plan: Plan,
): SheetPicture {
  const { boxes, width } = toBoxes(rows, graphs);
  const first = Math.max(...boxes.filter((box) => box.y === 0).map((box) => box.height));
  const second = Math.max(0, ...boxes.filter((box) => box.y === 1).map((box) => box.height));
  const crossing = plan.links.filter((link) => !link.beside);
  const rough = toPortMap(boxes, () => 0);
  const tracks = toTracks(crossing, (id) => rough.get(id)?.x ?? 0);
  const count = Math.max(0, ...tracks.values()) + (crossing.length === 0 ? 0 : 1);
  const gutter = count === 0 ? groupGap : 2 * gutterPadding + (count - 1) * trackGap;
  const yOf = (box: Box) => (box.y === 0 ? 0 : first + gutter);
  const ports = toPortMap(boxes, yOf);
  const beside = plan.links.filter((link) => link.beside);
  const jogs = toJogs(beside, ports, boxes);
  const lines = [
    ...toInnerLines(boxes, yOf, plan),
    ...beside.flatMap((link) => {
      const line = toBesideLine(link, ports, jogs.get(link) ?? 0);
      return line === null ? [] : [line];
    }),
    ...crossing.flatMap((link) => {
      const y = first + gutterPadding + (tracks.get(link) ?? 0) * trackGap;
      const line = toGutterLine(link, ports, y);
      return line === null ? [] : [line];
    }),
  ];
  const frames = boxes.map((box) => ({
    group: box.group,
    label: labelOf(box.group, {}),
    x: box.x,
    y: yOf(box),
    width: box.width,
    height: box.height,
  }));
  const height = second === 0 ? first + (count === 0 ? 0 : gutter) : first + gutter + second;
  return { frames, nodes: toPlacedNodes(sheet, boxes, yOf), lines, width, height };
}

/** Lays out each process group on its own with ELK, so nodes stay inside and frames cannot overlap, then sets the groups in one row or, past the limit, two, and routes what crosses between them. */
export async function toSheetPicture(sheet: Sheet, limit: number): Promise<SheetPicture> {
  const groups = groupOrder.filter((group) => sheet.nodes.some((node) => node.group === group));
  const lay = async (rows: string[][]) => {
    const plan = toPlan(sheet, rows);
    const graphs = groups.map((group) =>
      toLaidOutGroup(toGroupGraph(sheet, group, toPart(plan, group))),
    );
    return { plan, drawn: await Promise.all(graphs) };
  };
  const single = await lay([groups]);
  const rows = toRows(groups, single.drawn, limit);
  const { plan, drawn } = rows.length === 1 ? single : await lay(rows);
  const graphs = new Map(groups.map((group, index) => [group, drawn[index] ?? { id: group }]));
  return toPicture(sheet, rows, graphs, plan);
}
