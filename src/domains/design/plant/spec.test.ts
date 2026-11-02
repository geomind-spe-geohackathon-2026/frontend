import { describe, expect, it } from "vitest";
import {
  checkModuleId,
  learnPorts,
  modulesOfProblem,
  nextModuleId,
  readConnections,
  readModules,
  splitPort,
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

  it("learns the ports of a type from connections and points problems at modules", () => {
    const types = new Map([
      ["hx", "HeatExchanger"],
      ["pump", "CirculationPump"],
    ]);
    const ports = learnPorts(types, [
      { source: "hx.hot_out", target: "pump.fluid_in", stream: "brine", kind: null },
    ]);
    expect(ports.get("HeatExchanger")?.outlets.get("hot_out")).toBe("brine");
    expect(ports.get("CirculationPump")?.inlets.get("fluid_in")).toBe("brine");
    expect(modulesOfProblem("connections.0", readConnections(exampleSpec))).toEqual(["hx", "pump"]);
    expect(modulesOfProblem("params.hx.duty", [])).toEqual(["hx"]);
    expect(modulesOfProblem("format", [])).toEqual([]);
  });
});
