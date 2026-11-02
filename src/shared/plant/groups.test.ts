import { describe, expect, it } from "vitest";
import { toGroupFrames, toModuleGroups } from "./groups";
import type { Palette } from "@/shared/api/types";

function palette(entries: [string, string][]): Palette[] {
  return entries.map(([type, category]) => ({ type, title: type, category, summary: "" }));
}

const items = palette([
  ["Well", "wells"],
  ["Pair", "plants"],
  ["Degasser", "treatment"],
  ["Boiler", "heating"],
  ["Chiller", "cooling"],
  ["Grid", "grids"],
  ["Air", "environment"],
  ["Pipe", "piping"],
  ["Cooler", "exchangers"],
  ["Sensor", "control"],
]);

describe("toModuleGroups", () => {
  it("takes the group from gemini's category", () => {
    const modules = [
      { id: "w", type: "Well" },
      { id: "d", type: "Degasser" },
      { id: "b", type: "Boiler" },
      { id: "c", type: "Chiller" },
      { id: "g", type: "Grid" },
      { id: "a", type: "Air" },
    ];
    const groups = toModuleGroups(modules, [], [], items);
    expect([...groups.values()]).toEqual([
      "subsurface",
      "treatment",
      "heating",
      "cooling",
      "grids",
      "grids",
    ]);
  });

  it("puts a composite plant on brine in the subsurface group", () => {
    const modules = [
      { id: "p", type: "Pair" },
      { id: "d", type: "Degasser" },
    ];
    const connections = [{ source: "p.out", target: "d.in" }];
    expect(toModuleGroups(modules, connections, ["brine"], items).get("p")).toBe("subsurface");
  });

  it("places a general module by its streams and neighbours", () => {
    const modules = [
      { id: "pipe", type: "Pipe" },
      { id: "cooler", type: "Cooler" },
      { id: "chiller", type: "Chiller" },
      { id: "demand", type: "Grid" },
    ];
    const connections = [
      { source: "chiller.a_out", target: "cooler.in" },
      { source: "cooler.out", target: "chiller.a_in" },
      { source: "demand.out", target: "pipe.in" },
      { source: "pipe.out", target: "chiller.b_in" },
    ];
    const streams = ["hot_water", "hot_water", "chilled_water", "chilled_water"];
    const groups = toModuleGroups(modules, connections, streams, items);
    expect(groups.get("cooler")).toBe("cooling");
    expect(groups.get("pipe")).toBe("cooling");
  });

  it("calls an unconnected general module other", () => {
    const groups = toModuleGroups([{ id: "s", type: "Sensor" }], [], [], items);
    expect(groups.get("s")).toBe("other");
  });
});

describe("toGroupFrames", () => {
  it("frames the placed modules of each group in process order and skips empty groups", () => {
    const groups = new Map([
      ["b", "heating"],
      ["a", "subsurface"],
      ["c", "subsurface"],
      ["unplaced", "cooling"],
    ]);
    const layout = { a: { x: 0, y: 0 }, c: { x: 300, y: 100 }, b: { x: 900, y: 0 } };
    const frames = toGroupFrames(groups, layout, () => ({ width: 100, height: 50 }));
    expect(frames.map((frame) => frame.group)).toEqual(["subsurface", "heating"]);
    const first = frames[0];
    if (first === undefined) throw new Error("no frame");
    expect(first.label).toBe("Subsurface");
    expect(first.x).toBeLessThan(0);
    expect(first.x + first.width).toBeGreaterThan(400);
    expect(first.y + first.height).toBeGreaterThan(150);
  });
});
