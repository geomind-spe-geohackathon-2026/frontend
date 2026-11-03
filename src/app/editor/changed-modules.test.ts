import { describe, expect, it } from "vitest";
import type { Flowsheet } from "@/shared/api/types";
import { toChangedModules } from "./changed-modules";

function sheet(change: Partial<Flowsheet>): Flowsheet {
  return {
    project: "p1",
    spec: { params: { hx: { duty: 20 } } },
    structure: {},
    layout: {},
    version: 1,
    modules: [
      { id: "doublet", type: "Doublet", title: "Doublet", category: "wells" },
      { id: "hx", type: "HeatExchanger", title: "Heat Exchanger", category: "exchangers" },
    ],
    connections: [{ source: "doublet.supply_out", target: "hx.hot_in", kind: null, stream: null }],
    ...change,
  };
}

describe("toChangedModules", () => {
  it("finds new modules, changed parameters and both ends of a new connection", () => {
    const before = sheet({});
    const after = sheet({
      spec: { params: { hx: { duty: 25 } } },
      modules: [
        ...before.modules,
        { id: "hp", type: "HeatPump", title: "Heat Pump", category: "heating" },
      ],
      connections: [
        ...before.connections,
        { source: "hx.cold_out", target: "hp.source_in", kind: null, stream: null },
      ],
    });
    expect([...toChangedModules(before, after)].sort()).toEqual(["hp", "hx"]);
  });

  it("is empty when nothing changed", () => {
    expect(toChangedModules(sheet({}), sheet({})).size).toBe(0);
  });
});
