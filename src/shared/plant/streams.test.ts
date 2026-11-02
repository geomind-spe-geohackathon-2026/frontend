import { describe, expect, it } from "vitest";
import { toConnectionStreams } from "./streams";
import type { PortKinds } from "./spec";

function kinds(inlets: [string, string | null][], outlets: [string, string | null][]): PortKinds {
  return { inlets: new Map(inlets), outlets: new Map(outlets) };
}

describe("toConnectionStreams", () => {
  it("carries a stream through modules whose ports take any stream", () => {
    const ports = new Map([
      ["boiler", kinds([], [["fluid_out", "hot_water"]])],
      ["pipe", kinds([["fluid_in", null]], [["fluid_out", null]])],
      ["mixer", kinds([["a_in", null]], [["fluid_out", null]])],
      ["unknown", kinds([["fluid_in", null]], [])],
    ]);
    const connections = [
      { source: "boiler.fluid_out", target: "pipe.fluid_in" },
      { source: "pipe.fluid_out", target: "mixer.a_in" },
      { source: "mixer.fluid_out", target: "unknown.fluid_in" },
    ];
    expect(toConnectionStreams(connections, ports)).toEqual([
      "hot_water",
      "hot_water",
      "hot_water",
    ]);
  });

  it("keeps the two sides of an exchanger apart by port name", () => {
    const ports = new Map([
      [
        "hx",
        kinds(
          [
            ["hot_in", null],
            ["cold_in", null],
          ],
          [
            ["hot_out", null],
            ["cold_out", null],
          ],
        ),
      ],
      ["well", kinds([], [["fluid_out", "brine"]])],
      ["return", kinds([], [["fluid_out", "hot_water"]])],
      ["left", kinds([["fluid_in", null]], [])],
      ["right", kinds([["fluid_in", null]], [])],
    ]);
    const connections = [
      { source: "well.fluid_out", target: "hx.hot_in" },
      { source: "return.fluid_out", target: "hx.cold_in" },
      { source: "hx.hot_out", target: "left.fluid_in" },
      { source: "hx.cold_out", target: "right.fluid_in" },
    ];
    expect(toConnectionStreams(connections, ports)).toEqual([
      "brine",
      "hot_water",
      "brine",
      "hot_water",
    ]);
  });

  it("leaves a stream unknown when nothing states it", () => {
    const ports = new Map([
      ["a", kinds([], [["out", null]])],
      ["b", kinds([["in", null]], [])],
    ]);
    expect(toConnectionStreams([{ source: "a.out", target: "b.in" }], ports)).toEqual([null]);
  });
});
