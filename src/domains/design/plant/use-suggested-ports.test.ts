import { describe, expect, it } from "vitest";
import { toSuggested } from "./use-suggested-ports";

describe("toSuggested", () => {
  it("groups suggested ports by module and keeps how well each fits", () => {
    const suggested = toSuggested({
      port: "hp.heat_out",
      suggestions: [
        {
          port: "grid.supply_in",
          match: "exact",
          exact: ["medium"],
          loose: [],
          closes_loop: false,
        },
        { port: "grid.return_in", match: "loose", exact: [], loose: ["medium"], closes_loop: true },
        { port: "tank.in", match: "exact", exact: [], loose: [], closes_loop: false },
      ],
    });
    expect(suggested.get("grid")?.get("supply_in")).toBe("exact");
    expect(suggested.get("grid")?.get("return_in")).toBe("loose");
    expect(suggested.get("tank")?.get("in")).toBe("exact");
  });

  it("marks nothing without an answer", () => {
    expect(toSuggested(undefined).size).toBe(0);
  });
});
