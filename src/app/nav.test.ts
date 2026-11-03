import { describe, expect, it } from "vitest";
import { toHomeCrumbs, toProjectCrumbs } from "./nav";

const project = { id: "p1", name: "Plant A" };

describe("breadcrumbs", () => {
  it("shows only Projects on the home page", () => {
    expect(toHomeCrumbs("/projects")).toEqual([{ label: "Projects" }]);
  });

  it("links back to Projects from account and users", () => {
    expect(toHomeCrumbs("/users")).toEqual([
      { label: "Projects", to: "/projects" },
      { label: "Users" },
    ]);
  });

  it("shows the chat in the main panel while a design step is open", () => {
    const labels = toProjectCrumbs("/projects/p1/design/plant", project).map(
      (crumb) => crumb.label,
    );
    expect(labels).toEqual(["Projects", "Plant A", "Chat"]);
  });

  it("matches nested routes such as a run log", () => {
    const labels = toProjectCrumbs("/projects/p1/assistant/runs/r9", project).map(
      (crumb) => crumb.label,
    );
    expect(labels).toEqual(["Projects", "Plant A", "Runs and logs"]);
  });

  it("has no section for a top level page", () => {
    const labels = toProjectCrumbs("/projects/p1/overview", project).map((crumb) => crumb.label);
    expect(labels).toEqual(["Projects", "Plant A", "Overview"]);
  });
});
