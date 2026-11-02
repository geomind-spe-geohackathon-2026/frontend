import {
  toSheetPicture,
  sheetNodeHeight,
  sheetNodeWidth,
  type PlacedNode,
  type SheetLine,
  type SheetPicture,
} from "./flowsheet-layout";
import {
  toFullSheet,
  toSimpleSheet,
  type SheetConnection,
  type SheetModule,
} from "./flowsheet-sheet";
import type { GroupFrame } from "./groups";
import { toStreamDash, toStreamLabel } from "./stream-colors";

export type { SheetConnection, SheetModule } from "./flowsheet-sheet";

export const sheetFontSize = 12;
export const simpleSheetLimit = 800;
export const fullSheetLimit = 1170;

const lineHeight = 14;
const maximumLine = 13;
const legendHeight = 28;
const labelWidth = 6.6;
const legendStep = 124;
const margin = 2;
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

function toNumber(value: number): string {
  return String(Math.round(value * 10) / 10);
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

function toText(text: string, x: number, y: number, fill: string): string {
  return `<text x="${toNumber(x)}" y="${toNumber(y)}" font-size="${String(sheetFontSize)}" font-family="${sans}" fill="${fill}">${escapeText(text)}</text>`;
}

function toArrow(line: SheetLine): string {
  const end = line.points.at(-1);
  const before = line.points.at(-2);
  if (end === undefined || before === undefined) return "";
  const length = Math.hypot(end.x - before.x, end.y - before.y) || 1;
  const along = { x: (end.x - before.x) / length, y: (end.y - before.y) / length };
  const back = { x: end.x - along.x * 7, y: end.y - along.y * 7 };
  const corners = [
    end,
    { x: back.x - along.y * 3.5, y: back.y + along.x * 3.5 },
    { x: back.x + along.y * 3.5, y: back.y - along.x * 3.5 },
  ];
  const points = corners.map((point) => `${toNumber(point.x)},${toNumber(point.y)}`).join(" ");
  return `<polygon points="${points}" fill="${toColour(line.stream)}"/>`;
}

function toLineSvg(line: SheetLine): string {
  const points = line.points.map((point) => `${toNumber(point.x)},${toNumber(point.y)}`).join(" ");
  const dash = toStreamDash(line.stream);
  const pattern = dash === undefined ? "" : ` stroke-dasharray="${dash}"`;
  const body = `<polyline points="${points}" fill="none" stroke="${toColour(line.stream)}" stroke-width="1.5"${pattern}/>`;
  return line.arrow ? `${body}${toArrow(line)}` : body;
}

function toNodeSvg(node: PlacedNode): string {
  const lines = toTitleLines(node.title);
  const start = node.y + sheetNodeHeight / 2 - ((lines.length - 1) * lineHeight) / 2 + 4;
  const text = lines.map((line, index) =>
    toText(line, node.x + 6, start + index * lineHeight, ink),
  );
  const marks = node.marks.map(
    (mark, index) =>
      `<circle cx="${toNumber(node.x + sheetNodeWidth - 7 - index * 10)}" cy="${toNumber(node.y + 7)}" r="3.5" fill="${toColour(mark)}"/>`,
  );
  return `<rect x="${toNumber(node.x)}" y="${toNumber(node.y)}" width="${String(sheetNodeWidth)}" height="${String(sheetNodeHeight)}" rx="4" fill="#ffffff" stroke="${muted}" stroke-width="1"/>${text.join("")}${marks.join("")}`;
}

function toFrameSvg(frame: GroupFrame): string {
  return `<rect x="${toNumber(frame.x)}" y="${toNumber(frame.y)}" width="${toNumber(frame.width)}" height="${toNumber(frame.height)}" rx="6" fill="#f1f4f7"/>`;
}

function toLabelSvg(frame: GroupFrame): string {
  const width = frame.label.length * labelWidth + 8;
  return `<rect x="${toNumber(frame.x + 6)}" y="${toNumber(frame.y + 5)}" width="${toNumber(width)}" height="16" fill="#f1f4f7"/>${toText(frame.label, frame.x + 10, frame.y + 17, muted)}`;
}

function toLegendSvg(picture: SheetPicture, x: number, y: number): string {
  const lined = picture.lines.flatMap((line) => line.stream ?? []);
  const marked = picture.nodes.flatMap((node) => node.marks);
  const streams = [...new Set(lined)];
  const dots = [...new Set(marked)].filter((stream) => !streams.includes(stream));
  const entries = [
    ...streams.map((stream) => ({ stream, dot: false })),
    ...dots.map((stream) => ({ stream, dot: true })),
  ];
  return entries
    .map(({ stream, dot }, index) => {
      const left = x + index * legendStep;
      const sign = dot
        ? `<circle cx="${toNumber(left + 10)}" cy="${toNumber(y)}" r="3.5" fill="${toColour(stream)}"/>`
        : `<rect x="${toNumber(left)}" y="${toNumber(y - 1.5)}" width="22" height="3" fill="${toColour(stream)}"/>`;
      return `${sign}${toText(toStreamLabel(stream), left + 28, y + 4, muted)}`;
    })
    .join("");
}

function toSvg(picture: SheetPicture): string {
  const left = -margin;
  const top = -margin;
  const width = picture.width + 2 * margin;
  const height = picture.height + 2 * margin + legendHeight;
  const body = [
    `<rect x="${String(left)}" y="${String(top)}" width="${toNumber(width)}" height="${toNumber(height)}" fill="#ffffff"/>`,
    ...picture.frames.map(toFrameSvg),
    ...picture.lines.map(toLineSvg),
    ...picture.frames.map(toLabelSvg),
    ...picture.nodes.map(toNodeSvg),
    toLegendSvg(picture, 0, picture.height + legendHeight / 2 + 2),
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${String(left)} ${String(top)} ${toNumber(width)} ${toNumber(height)}">${body.join("")}</svg>`;
}

/** Draws the process of a plant for the report: main units only, wrapped to stay readable on a page. */
export async function toFlowsheetSvg(
  modules: SheetModule[],
  connections: SheetConnection[],
): Promise<string> {
  return toSvg(await toSheetPicture(toSimpleSheet(modules, connections), simpleSheetLimit));
}

/** Draws every module of a plant, for the report's appendix. */
export async function toFullFlowsheetSvg(
  modules: SheetModule[],
  connections: SheetConnection[],
): Promise<string> {
  return toSvg(await toSheetPicture(toFullSheet(modules, connections), fullSheetLimit));
}
