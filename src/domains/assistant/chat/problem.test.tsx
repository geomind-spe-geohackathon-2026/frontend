import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProblemView } from "./problem";

describe("ProblemView", () => {
  it("leaves out null, empty and none entries", () => {
    render(
      <ProblemView document={{ goal: "Size a plant", design: null, results: [], notes: {} }} />,
    );
    expect(screen.getByText("goal")).toBeVisible();
    expect(screen.queryByText("design")).toBeNull();
    expect(screen.queryByText("none")).toBeNull();
  });

  it("says nothing is recorded when every entry is empty", () => {
    render(<ProblemView document={{ design: null }} />);
    expect(screen.getByText("Nothing recorded yet.")).toBeVisible();
  });
});
