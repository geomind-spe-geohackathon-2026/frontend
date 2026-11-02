import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProblemView } from "./problem";

describe("ProblemView", () => {
  it("leaves out null, empty and none entries", () => {
    render(
      <ProblemView document={{ goal: "Size a plant", design: null, results: [], notes: {} }} />,
    );
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.queryByText("design")).toBeNull();
    expect(screen.queryByText("none")).toBeNull();
  });

  it("shows no raw objects", () => {
    render(<ProblemView document={{ results: { lcts: 40 }, goal: "Size a plant" }} />);
    expect(screen.queryByText(/lcts/)).toBeNull();
  });

  it("says what the chat has read", () => {
    render(<ProblemView document={{ case: { name: "c" } }} />);
    expect(screen.getByText("read")).toBeVisible();
    render(<ProblemView document={{ design: null }} />);
    expect(screen.getByText("not read yet")).toBeVisible();
  });
});
