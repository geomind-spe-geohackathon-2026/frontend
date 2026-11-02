import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderApp } from "@/testing/render-app";

const path = "/projects/example-project-1/design/report?result=example-result-2";

describe("ReportPage", () => {
  it("shows a live preview of the chosen result and sections", async () => {
    renderApp({ path });
    expect(
      await screen.findByRole("heading", { name: "Example report for example-result-2" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Costs and sources" })).toBeVisible();
    expect(await screen.findByText("missing", {}, { timeout: 4000 })).toBeVisible();
  });

  it("renders a pipe table of a section as a real table", async () => {
    renderApp({ path });
    expect(await screen.findByRole("cell", { name: "3 MW" }, { timeout: 4000 })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Capacity" })).toBeVisible();
  });

  it("drops a section from the preview when it is unchecked", async () => {
    const user = userEvent.setup();
    renderApp({ path });
    await screen.findByRole("heading", { name: "Agent log and tokens" });
    await user.click(screen.getByRole("checkbox", { name: "Agent log and tokens" }));
    expect(await screen.findByRole("heading", { name: "Capacities" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Agent log and tokens" })).not.toBeInTheDocument();
  });

  it("exports Markdown as a download and toasts", async () => {
    const user = userEvent.setup();
    URL.createObjectURL = vi.fn(() => "blob:example");
    URL.revokeObjectURL = vi.fn();
    renderApp({ path });
    await user.click(await screen.findByRole("button", { name: "Export Markdown" }));
    expect(await screen.findByText("report-example-design-b.md exported")).toBeVisible();
  });
});
