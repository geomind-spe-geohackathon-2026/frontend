import { describe, expect, it } from "vitest";
import { toHints } from "./panel-hints";
import { emptyView, type View } from "./view";

function withTools(status: View["status"], tools: [string, "done" | "failed"][]): View {
  const blocks: View["blocks"] = tools.map(([tool, state], index) => ({
    kind: "tool",
    id: `c${String(index)}`,
    agent: "lead",
    tool,
    input: {},
    state,
    summary: "",
    duration: 1,
    error: null,
    problem: null,
  }));
  return { ...emptyView, status, blocks };
}

describe("toHints", () => {
  it("offers the pages a finished run changed, in design order", () => {
    const view = withTools("done", [
      ["build_plant", "done"],
      ["accept_case", "done"],
      ["read_case", "done"],
    ]);
    expect(toHints(view).map((hint) => hint.label)).toEqual(["Open Case", "Open Plant"]);
  });

  it("offers nothing for failed tools or a run that is still going", () => {
    expect(toHints(withTools("done", [["build_plant", "failed"]]))).toEqual([]);
    expect(toHints(withTools("running", [["build_plant", "done"]]))).toEqual([]);
  });
});
