import { describe, expect, it } from "vitest";
import {
  headerHeight,
  nodeWidth,
  portRowHeight,
  toAutoLayout,
  toElkGraph,
  toFanConnections,
  toNodeSize,
  toStartViewport,
} from "./auto-layout";
import type { PortKinds } from "./spec";

const hub: PortKinds = { inlets: new Map(), outlets: new Map([["power_out", "electricity"]]) };
const unit: PortKinds = {
  inlets: new Map([
    ["fluid_in", null],
    ["power_in", "electricity"],
  ]),
  outlets: new Map([["fluid_out", null]]),
};
const modules = [
  { id: "a", type: "Unit" },
  { id: "b", type: "Unit" },
  { id: "c", type: "Unit" },
  { id: "grid", type: "Hub" },
];
const ports = new Map([
  ["a", unit],
  ["b", unit],
  ["c", unit],
  ["grid", hub],
]);
const groups = new Map([
  ["a", "treatment"],
  ["b", "subsurface"],
  ["c", "heating"],
  ["grid", "grids"],
]);
const connections = [
  { source: "b.fluid_out", target: "a.fluid_in" },
  { source: "a.fluid_out", target: "c.fluid_in" },
  { source: "grid.power_out", target: "a.power_in" },
  { source: "grid.power_out", target: "b.power_in" },
  { source: "grid.power_out", target: "c.power_in" },
];

describe("toNodeSize", () => {
  it("grows with the larger port column", () => {
    const { width, height } = toNodeSize(unit);
    expect(width).toBe(nodeWidth);
    expect(height).toBeGreaterThanOrEqual(headerHeight + 2 * portRowHeight);
    expect(toNodeSize(undefined).height).toBeGreaterThan(headerHeight);
  });
});

describe("toFanConnections", () => {
  it("finds the connections of a port shared by many", () => {
    expect([...toFanConnections(connections)]).toEqual([2, 3, 4]);
  });
});

describe("toElkGraph", () => {
  const graph = toElkGraph(modules, connections, ports, groups);

  it("fixes ports on the sides they are drawn and gives each group its partition", () => {
    const node = graph.children?.find((child) => child.id === "a");
    expect(node?.layoutOptions).toMatchObject({
      "elk.portConstraints": "FIXED_POS",
      "elk.partitioning.partition": "1",
    });
    const outlet = node?.ports?.find((port) => port.id === "a.fluid_out");
    expect(outlet?.x).toBe(nodeWidth);
    expect(outlet?.y).toBe(headerHeight + portRowHeight / 2);
    expect(node?.ports?.find((port) => port.id === "a.fluid_in")?.x).toBe(0);
  });

  it("runs left to right and leaves fan connections out of the layout", () => {
    expect(graph.layoutOptions?.["elk.direction"]).toBe("RIGHT");
    expect(graph.edges?.map((edge) => edge.id)).toEqual(["c0", "c1"]);
  });

  it("skips a connection to a module that is gone and ties an unknown port to its node", () => {
    const edges = toElkGraph(
      modules.slice(0, 2),
      [
        { source: "a.fluid_out", target: "gone.fluid_in" },
        { source: "a.other", target: "b.fluid_in" },
      ],
      ports,
      groups,
    ).edges;
    expect(edges).toEqual([{ id: "c1", sources: ["a"], targets: ["b"] }]);
  });
});

describe("toAutoLayout", () => {
  it("places the groups in process order, whatever the module order", async () => {
    const placed = await toAutoLayout(modules, connections, ports, groups);
    const x = (id: string) => placed[id]?.x ?? Number.NaN;
    expect(x("b")).toBeLessThan(x("a"));
    expect(x("a")).toBeLessThan(x("c"));
    expect(x("c")).toBeLessThan(x("grid"));
  });
});

describe("toStartViewport", () => {
  const limits = { minimum: 0.5, maximum: 1, margin: 10 };

  it("centres a plant that fits without enlarging it", () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 };
    expect(toStartViewport(bounds, { width: 520, height: 320 }, limits, bounds)).toEqual({
      x: 210,
      y: 110,
      zoom: 1,
    });
  });

  it("keeps the readable zoom for a large plant and starts at its left", () => {
    const bounds = { x: 100, y: 0, width: 4000, height: 400 };
    const first = { x: 100, y: 0, width: 400, height: 400 };
    const start = toStartViewport(bounds, { width: 800, height: 600 }, limits, first);
    expect(start.zoom).toBe(0.5);
    expect(start.x).toBe(10 - 100 * 0.5);
  });

  it("centres the first group in the height when the plant is too tall", () => {
    const bounds = { x: 0, y: 0, width: 4000, height: 4000 };
    const first = { x: 0, y: 2000, width: 400, height: 400 };
    const start = toStartViewport(bounds, { width: 800, height: 600 }, limits, first);
    expect(start.y).toBe(300 - 2200 * 0.5);
  });
});
