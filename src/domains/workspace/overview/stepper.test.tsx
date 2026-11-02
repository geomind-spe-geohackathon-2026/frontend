import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ActivityList } from "./activity-list";
import { Stepper } from "./stepper";
import type { Activity, Project } from "@/shared/api/types";

const step = { state: "done", label: "1 result" } as const;
const progress: Project["progress"] = {
  case: step,
  plant: step,
  study: step,
  results: step,
  report: step,
};

describe("Stepper", () => {
  it("shows study and results as out of date when marked stale", () => {
    render(
      <MemoryRouter>
        <Stepper projectId="p1" progress={progress} stale={new Set(["study", "results"])} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Out of date")).toHaveLength(2);
  });
});

describe("ActivityList", () => {
  it("folds repeated rows into one with a count", () => {
    const item: Activity = {
      id: "a1",
      time: new Date().toISOString(),
      actor: { kind: "user", name: "Admin" },
      text: "Admin exported the report",
      link: null,
    };
    render(
      <MemoryRouter>
        <ActivityList projectId="p1" items={[item, { ...item, id: "a2" }]} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Admin exported the report")).toHaveLength(1);
    expect(screen.getByText("2 times")).toBeVisible();
  });

  it("does not repeat the actor when the text already starts with it", () => {
    const item: Activity = {
      id: "a1",
      time: new Date().toISOString(),
      actor: { kind: "agent", name: "Assistant" },
      text: "Assistant run done",
      link: null,
    };
    render(
      <MemoryRouter>
        <ActivityList projectId="p1" items={[item]} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Assistant run done")).toBeVisible();
    expect(screen.queryByText("Assistant Assistant run done")).toBeNull();
  });
});
