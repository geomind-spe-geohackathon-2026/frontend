import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { toRoute } from "@/mocks/url";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

vi.setConfig({ testTimeout: 20_000 });

const base = "/projects/example-project-1/assistant/runs";

describe("runs page", () => {
  it("lists the runs with chat title, status, tokens and cost, and the project totals", async () => {
    renderApp({ path: base });
    const table = await screen.findByRole("table", { name: /Runs of this project/ });
    const row = within(table).getByRole("link", { name: "example-run-1" }).closest("tr");
    expect(row).not.toBeNull();
    expect(within(row ?? table).getByText("Design the example plant")).toBeVisible();
    expect(within(row ?? table).getByText("done")).toBeVisible();
    expect(await screen.findByText(/Project total/)).toHaveTextContent("1 runs");
  });

  it("says so when the project has no runs", async () => {
    renderApp({ path: "/projects/example-project-2/assistant/runs" });
    expect(await screen.findByText(/No runs yet/)).toBeVisible();
  });

  it("shows a permission message for a forbidden list", async () => {
    server.use(
      http.get(toRoute("/assistant/runs"), () =>
        HttpResponse.json(
          { error: { code: "forbidden", message: "no", details: {} } },
          { status: 403 },
        ),
      ),
    );
    renderApp({ path: base });
    expect(await screen.findByText(/You do not have permission to see The runs/)).toBeVisible();
  });
});

describe("run log page", () => {
  it("opens from the table and shows the steps, the selected step and the totals", async () => {
    renderApp({ path: base });
    await userEvent.setup().click(await screen.findByRole("link", { name: "example-run-1" }));
    expect(await screen.findByRole("heading", { name: "Run example-run-1" })).toBeVisible();
    const steps = screen.getByRole("navigation", { name: "Steps" });
    expect(within(steps).getByRole("button", { name: /coordinator · step 0/ })).toBeVisible();
    expect(screen.getByRole("heading", { name: /LLM call · coordinator · step 0/ })).toBeVisible();
    expect(screen.getByRole("table", { name: "Per agent" })).toBeVisible();
    expect(screen.getByRole("table", { name: "Per model" })).toBeVisible();
    expect(screen.getByText(/System prompt and history/)).toBeVisible();
  });

  it("shows the tool call of another step with its input and output", async () => {
    renderApp({ path: `${base}/example-run-1` });
    const steps = await screen.findByRole("navigation", { name: "Steps" });
    await userEvent.setup().click(within(steps).getByRole("button", { name: /designer · step 1/ }));
    expect(await screen.findByRole("heading", { name: "Tool call · size_plant" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Input" })).toHaveTextContent("example");
    expect(screen.getByRole("region", { name: "Output" })).toHaveTextContent("size_plant finished");
  });

  it("offers the two exports", async () => {
    renderApp({ path: `${base}/example-run-1` });
    expect(await screen.findByRole("button", { name: "Export JSON" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Export Markdown" })).toBeVisible();
  });

  it("shows the error for a run that does not exist", async () => {
    renderApp({ path: `${base}/missing` });
    expect(await screen.findByText(/run_not_found/)).toBeVisible();
  });
});
