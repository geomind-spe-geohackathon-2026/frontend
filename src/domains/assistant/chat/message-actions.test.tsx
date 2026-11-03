import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MessageButtons } from "./message-actions";

const answer = {
  id: "m2",
  chat: "c1",
  role: "assistant" as const,
  content: "The plant fits.",
  created: "2026-11-03T21:00:00Z",
  run: "r1",
};

describe("message buttons", () => {
  it("offers copy and the run log under an answer", () => {
    render(
      <MemoryRouter>
        <MessageButtons projectId="p1" message={answer} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log of this run" })).toHaveAttribute(
      "href",
      "/projects/p1/assistant/runs/r1",
    );
  });

  it("shows the time and no run log under the user's message", () => {
    render(
      <MemoryRouter>
        <MessageButtons projectId="p1" message={{ ...answer, role: "user", run: null }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.querySelector("time")).not.toBeNull();
  });
});
