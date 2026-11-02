import { describe, expect, it } from "vitest";
import fixture from "./flowsheet.fixture.json";
import {
  sheetNodeHeight,
  sheetNodeWidth,
  toSheetPicture,
  type SheetPicture,
} from "./flowsheet-layout";
import { toFullSheet, toKnownStreams, toSimpleSheet } from "./flowsheet-sheet";
import {
  fullSheetLimit,
  simpleSheetLimit,
  toFlowsheetSvg,
  toFullFlowsheetSvg,
} from "./flowsheet-svg";

const portraitPoints = 538;
const landscapePoints = 785;
const pagePixels = 738;
const { modules, connections } = fixture;

function toViewWidth(svg: string): number {
  return Number(/viewBox="\S+ \S+ (\S+) /.exec(svg)?.[1]);
}

function toFontSizes(svg: string): number[] {
  return [...svg.matchAll(/font-size="([\d.]+)"/g)].map((match) => Number(match[1]));
}

function expectTidy(picture: SheetPicture) {
  const { frames, nodes } = picture;
  for (const [index, first] of frames.entries()) {
    for (const second of frames.slice(index + 1)) {
      const apart =
        first.x + first.width <= second.x ||
        second.x + second.width <= first.x ||
        first.y + first.height <= second.y ||
        second.y + second.height <= first.y;
      expect(apart, `${first.group} and ${second.group}`).toBe(true);
    }
  }
  for (const node of nodes) {
    const frame = frames.find((item) => item.group === node.group);
    expect(frame, node.id).toBeDefined();
    expect(node.x).toBeGreaterThanOrEqual(frame?.x ?? Infinity);
    expect(node.y).toBeGreaterThanOrEqual(frame?.y ?? Infinity);
    expect(node.x + sheetNodeWidth).toBeLessThanOrEqual((frame?.x ?? 0) + (frame?.width ?? 0));
    expect(node.y + sheetNodeHeight).toBeLessThanOrEqual((frame?.y ?? 0) + (frame?.height ?? 0));
  }
}

describe("the process diagram of a report", () => {
  it("drops pipes, mixers and splitters and joins what they connect", () => {
    const sheet = toSimpleSheet(modules, connections);
    const ids = sheet.nodes.map((node) => node.id);
    expect(ids).not.toContain("heating_supply_pipe");
    expect(ids).not.toContain("production_mixers.0");
    expect(ids).not.toContain("injection_splitters.1");
    expect(sheet.edges).toContainEqual({
      source: "peak_boiler",
      target: "heating_consumer",
      stream: "hot_water",
    });
    expect(sheet.edges).toContainEqual({ source: "d0", target: "degasser", stream: "brine" });
  });

  it("draws alike modules once with a count", () => {
    const sheet = toSimpleSheet(modules, connections);
    const doublets = sheet.nodes.filter((node) => node.title.startsWith("Doublet"));
    expect(doublets.map((node) => node.title)).toEqual(["Doublets ×3"]);
    expect(sheet.edges.some((edge) => edge.source === "d1" || edge.target === "d2")).toBe(false);
  });

  it("leaves out air and heat losses, and marks shared electricity on the node", () => {
    const sheet = toSimpleSheet(modules, connections);
    const streams = new Set(sheet.edges.map((edge) => edge.stream));
    expect(streams.has("air")).toBe(false);
    expect(streams.has("heat")).toBe(false);
    expect(sheet.nodes.find((node) => node.id === "heat_pump")?.marks).toEqual(["electricity"]);
  });

  it("names the stream of every process line", () => {
    const sheet = toSimpleSheet(modules, connections);
    expect(sheet.edges.filter((edge) => edge.stream === null)).toEqual([]);
    expect(toKnownStreams(modules, connections).filter((stream) => stream === null)).toEqual([]);
  });

  it("keeps groups apart and nodes inside them", async () => {
    expectTidy(await toSheetPicture(toSimpleSheet(modules, connections), simpleSheetLimit));
  });

  it("reads at 8 pt in the PDF and 11 px on the page", async () => {
    const svg = await toFlowsheetSvg(modules, connections);
    const smallest = Math.min(...toFontSizes(svg));
    expect((smallest * portraitPoints) / toViewWidth(svg)).toBeGreaterThanOrEqual(8);
    expect((smallest * pagePixels) / toViewWidth(svg)).toBeGreaterThanOrEqual(11);
  });
});

describe("the full flowsheet of the appendix", () => {
  it("has every module", () => {
    expect(toFullSheet(modules, connections).nodes).toHaveLength(modules.length);
  });

  it("keeps groups apart and nodes inside them", async () => {
    expectTidy(await toSheetPicture(toFullSheet(modules, connections), fullSheetLimit));
  });

  it("reads at 8 pt on a landscape page", async () => {
    const svg = await toFullFlowsheetSvg(modules, connections);
    const smallest = Math.min(...toFontSizes(svg));
    expect((smallest * landscapePoints) / toViewWidth(svg)).toBeGreaterThanOrEqual(8);
  });
});
