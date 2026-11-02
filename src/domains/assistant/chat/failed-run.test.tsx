import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { fromEvent } from "@/shared/sse/events";
import type { RunEvent } from "@/shared/sse/types";
import { Blocks } from "./blocks";
import stored from "./failed-run.fixture.json";
import { applyEvent, emptyView } from "./view";

function toEvents(): RunEvent[] {
  return stored.flatMap((data) => {
    const event = fromEvent(data.type, JSON.stringify(data), String(data.sequence));
    return event === null ? [] : [event];
  });
}

const view = toEvents().reduce(applyEvent, emptyView);

describe("a run that stopped on an internal error", () => {
  it("keeps every study the run recorded, with its best value", () => {
    expect(view.studies.map((study) => [study.name, study.best])).toEqual([
      ["hhpc_sized", null],
      ["hhpc_size1", null],
      ["lcts_opt1", "LCTS 40.34 EUR/MWh"],
    ]);
  });

  it("shows a readable failure, not the raw error, and links the studies", () => {
    render(
      <MemoryRouter initialEntries={["/projects/p1/assistant/chat"]}>
        <Routes>
          <Route
            path="/projects/:projectId/assistant/chat"
            element={<Blocks blocks={view.blocks} running={false} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "The assistant stopped with an internal error in geomind",
    );
    expect(screen.queryByText(/sequence item 0/)).toBeNull();
    const link = screen.getByRole("link", { name: "lcts_opt1" });
    expect(link).toHaveAttribute("href", "/projects/p1/design/study");
    expect(link.closest("li")).toHaveTextContent("lcts_opt1 LCTS 40.34 EUR/MWh");
  });
});
