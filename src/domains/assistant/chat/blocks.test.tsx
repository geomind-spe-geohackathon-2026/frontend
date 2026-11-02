import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Blocks } from "./blocks";
import type { Block } from "./view";

function text(id: string, value: string): Block {
  return { kind: "text", id, agent: "coordinator", text: value, open: false };
}

describe("Blocks", () => {
  it("shows the coordinator's route as a small label", () => {
    render(
      <Blocks
        running={false}
        blocks={[text("b0", '{"kind": "loop", "loop": "tool", "agent": "analyst"}')]}
      />,
    );
    expect(screen.getByText("Routed to analyst, tool loop")).toBeVisible();
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
    expect(screen.getByText("Answered: Allow save?")).toBeVisible();
  });

  it("does not say Thinking once the run is over", () => {
    const open: Block = { kind: "text", id: "b0", agent: "a", text: "", open: true };
    const { rerender } = render(<Blocks running blocks={[open]} />);
    expect(screen.getByText("Thinking")).toBeVisible();
    rerender(<Blocks running={false} blocks={[open]} />);
    expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
  });
});
