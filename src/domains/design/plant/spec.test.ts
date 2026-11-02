import { describe, expect, it } from "vitest";
import type { ModulePorts } from "@/shared/api/types";
import {
  checkModuleId,
  isSameKind,
  modulesOfProblem,
  nextModuleId,
  readConnections,
  readModules,
  splitPort,
  toPorts,
  withConnection,
  withModule,
  withoutConnection,
  withoutModule,
  withRenamedModule,
} from "./spec";

const exampleSpec = {
  format: 1,
  modules: { hx: { type: "HeatExchanger" }, pump: { type: "CirculationPump" } },
  connections: [{ source: "hx.hot_out", target: "pump.fluid_in" }],
  params: { hx: { duty: { value: 1, unit: "MW" } }, pump: {} },
};

describe("plant spec edits", () => {
  it("reads modules and connections", () => {
    expect(readModules(exampleSpec)).toEqual([
      { id: "hx", type: "HeatExchanger" },
      { id: "pump", type: "CirculationPump" },
    ]);
    expect(readConnections(exampleSpec)).toHaveLength(1);
    expect(splitPort("hx.hot_out")).toEqual({ module: "hx", port: "hot_out" });
  });

  it("suggests a free snake_case id", () => {
    expect(nextModuleId(exampleSpec, "Valve")).toBe("valve");
    expect(nextModuleId(withModule(exampleSpec, "valve", "Valve"), "Valve")).toBe("valve_2");
    expect(nextModuleId(exampleSpec, "HeatExchanger")).toBe("heat_exchanger");
  });

  it("removes a module with its connections and parameters", () => {
    const next = withoutModule(exampleSpec, "hx");
    expect(readModules(next).map((module) => module.id)).toEqual(["pump"]);
    expect(readConnections(next)).toEqual([]);
    expect(next.params).toEqual({ pump: {} });
  });

  it("renames a module everywhere", () => {
    const next = withRenamedModule(exampleSpec, "hx", "exchanger");
    expect(readModules(next)[0]).toEqual({ id: "exchanger", type: "HeatExchanger" });
    expect(readConnections(next)[0]?.source).toBe("exchanger.hot_out");
    expect(next.params).toHaveProperty("exchanger");
  });

  it("adds and removes a connection without touching the input", () => {
    const added = withConnection(exampleSpec, { source: "pump.fluid_out", target: "hx.hot_in" });
    expect(readConnections(added)).toHaveLength(2);
    expect(readConnections(withoutConnection(added, 0))).toHaveLength(1);
    expect(readConnections(exampleSpec)).toHaveLength(1);
  });

  it("checks a new module id", () => {
    expect(checkModuleId(exampleSpec, "hx", "")).not.toBeNull();
    expect(checkModuleId(exampleSpec, "hx", "a.b")).not.toBeNull();
    expect(checkModuleId(exampleSpec, "hx", "pump")).not.toBeNull();
    expect(checkModuleId(exampleSpec, "hx", "hx")).toBeNull();
    expect(checkModuleId(exampleSpec, "hx", "exchanger")).toBeNull();
  });

  it("points problems at modules", () => {
    expect(modulesOfProblem("connections.0", readConnections(exampleSpec))).toEqual(["hx", "pump"]);
    expect(modulesOfProblem("params.hx.duty", [])).toEqual(["hx"]);
    expect(modulesOfProblem("format", [])).toEqual([]);
  });
});

const catalog: ModulePorts[] = [
  {
    type: "HeatExchanger",
    inlets: [{ port: "hot_in", kind: "brine" }],
    outlets: [{ port: "hot_out", kind: "brine" }],
  },
  {
    type: "CirculationPump",
    inlets: [{ port: "fluid_in", kind: "brine" }],
    outlets: [{ port: "fluid_out", kind: null }],
  },
];

describe("plant ports from the catalog", () => {
  const modules = readModules(exampleSpec);
  const ports = toPorts(modules, catalog);

  it("gives every module its ports by type, with no connection needed", () => {
    expect(ports.get("hx")?.outlets.get("hot_out")).toBe("brine");
    expect(ports.get("pump")?.inlets.get("fluid_in")).toBe("brine");
    expect(
      toPorts([{ id: "lonely", type: "HeatExchanger" }], catalog).get("lonely")?.inlets,
    ).toEqual(new Map([["hot_in", "brine"]]));
  });

  it("gives a module of an unknown type no ports", () => {
    const unknown = toPorts([{ id: "x", type: "Unknown" }], catalog).get("x");
    expect(unknown?.inlets.size).toBe(0);
    expect(unknown?.outlets.size).toBe(0);
  });

  it("accepts equal stream kinds and refuses different ones", () => {
    expect(isSameKind(ports, "hx", "hot_out", "pump", "fluid_in")).toBe(true);
    const other = toPorts(modules, [
      catalog[0] ?? { type: "", inlets: [], outlets: [] },
      { type: "CirculationPump", inlets: [{ port: "fluid_in", kind: "gas" }], outlets: [] },
    ]);
    expect(isSameKind(other, "hx", "hot_out", "pump", "fluid_in")).toBe(false);
  });

  it("accepts a port whose kind gemini does not name", () => {
    expect(isSameKind(ports, "pump", "fluid_out", "hx", "hot_in")).toBe(true);
  });

  it("refuses a port the catalog does not list", () => {
    expect(isSameKind(ports, "hx", "typed_by_hand", "pump", "fluid_in")).toBe(false);
  });
});
