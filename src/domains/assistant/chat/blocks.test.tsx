import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Blocks } from "./blocks";
import type { Block } from "./view";

function text(id: string, value: string): Block {
  return {
    kind: "text",
    id,
    agent: "coordinator",
    text: value,
    open: false,
    settled: value.length,
  };
}

function liveText(value: string): Block {
  return {
    kind: "text",
    id: "b0",
    agent: "coordinator",
    text: value,
    open: true,
    settled: value.length,
  };
}

function tool(id: string, error: string | null): Block {
  return {
    kind: "tool",
    id,
    agent: "analyst",
    tool: "save_profile",
    input: {},
    state: error === null ? "done" : "failed",
    summary: "",
    duration: 0,
    error,
  };
}

describe("Blocks", () => {
  it("shows a failure the run ended on, outside the closed steps", () => {
    render(<Blocks running={false} blocks={[tool("t1", "No such file")]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No such file");
  });

  it("does not repeat a failure the agent went on from", () => {
    render(<Blocks running={false} blocks={[tool("t1", "No such file"), tool("t2", null)]} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hides the coordinator's route", () => {
    render(
      <Blocks
        running={false}
        blocks={[text("b0", '{"kind": "loop", "loop": "tool", "agent": "analyst"}')]}
      />,
    );
    expect(screen.queryByText(/Routed to/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"kind"/)).not.toBeInTheDocument();
  });

  it("shows a direct answer as text", () => {
    render(
      <Blocks running={false} blocks={[text("b0", '{"kind": "answer", "answer": "Yes."}')]} />,
    );
    expect(screen.getByText("Yes.")).toBeVisible();
  });

  it("collapses a tool result on one line and lays it out when opened", () => {
    const tool: Block = {
      kind: "tool",
      id: "t1",
      agent: "analyst",
      tool: "list_plants",
      input: {},
      state: "done",
      summary: "{'plants': ['a', 'b']}",
      duration: 0.2,
      error: null,
    };
    const { container } = render(<Blocks running={false} blocks={[tool]} />);
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(container.querySelectorAll("pre")[1]?.textContent).toContain('"plants": [\n');
  });

  it("shows a pending request nowhere inline and an answered one as a short marker", () => {
    const request = { request: "r1", kind: "approval" as const, message: "Allow save?" };
    const pending: Block = { kind: "request", id: "q", agent: "a", request, resolved: false };
    const { rerender } = render(<Blocks running blocks={[pending]} />);
    expect(screen.queryByText(/Allow save/)).not.toBeInTheDocument();
    rerender(<Blocks running blocks={[{ ...pending, resolved: true }]} />);
    expect(screen.getByText("You answered: Allow save?")).toBeInTheDocument();
  });

  it("folds the work into one line and keeps a failure that was retried inside it", () => {
    const failed: Block = {
      kind: "tool",
      id: "t1",
      agent: "coordinator.designer",
      tool: "size_plant",
      input: {},
      state: "failed",
      summary: "",
      duration: 0.2,
      error: "size.doublets.range is missing",
    };
    const note = text("b0", 'design loop: {"round": 1}');
    const { container } = render(<Blocks running={false} blocks={[note, failed]} />);
    expect(screen.getByText("Worked through 1 step, 1 needed another try")).toBeVisible();
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.queryByText(/design loop/)).not.toBeInTheDocument();
  });

  it("shows text live while the run goes, not only in the closed steps", () => {
    render(<Blocks running blocks={[liveText("The doublet delivers")]} />);
    expect(screen.getByText("The doublet delivers")).toBeVisible();
  });

  it("shows the answer of a route still being written, and never its JSON", () => {
    const route = '{"kind": "answer", "answer": "The doublet';
    render(<Blocks running blocks={[liveText(route)]} />);
    expect(screen.getByText("The doublet")).toBeVisible();
    expect(screen.queryByText(/"kind"/)).not.toBeInTheDocument();
  });

  it("hides a route to a loop while it is written", () => {
    render(<Blocks running blocks={[liveText('{"kind": "loop", "lo')]} />);
    expect(screen.queryByText(/kind/)).not.toBeInTheDocument();
  });

  it("does not say Thinking once the run is over", () => {
    const open: Block = { kind: "text", id: "b0", agent: "a", text: "", open: true, settled: 0 };
    const { rerender } = render(<Blocks running blocks={[open]} />);
    expect(screen.getByText("Thinking")).toBeVisible();
    rerender(<Blocks running={false} blocks={[open]} />);
    expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
  });
});
