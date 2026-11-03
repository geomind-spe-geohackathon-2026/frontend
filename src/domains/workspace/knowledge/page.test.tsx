import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

const path = "/knowledge";

describe("knowledge page", () => {
  it("lists cited values with their source and status", async () => {
    renderApp({ path });
    const row = (await screen.findByText("Example drilling cost")).closest("tr");
    if (row === null) throw new Error("row missing");
    expect(within(row).getByText("1200 EUR/m (2024)")).toBeVisible();
    expect(within(row).getByText("Example cost report")).toBeVisible();
    expect(within(row).getByText("verified")).toBeVisible();
  });

  it("filters by the search words", async () => {
    const user = userEvent.setup();
    renderApp({ path });
    await screen.findByText("Example drilling cost");
    await user.type(screen.getByLabelText("Search the knowledge"), "heat pump");
    expect(await screen.findByText("Example heat pump cost")).toBeVisible();
    expect(screen.queryByText("Example drilling cost")).not.toBeInTheDocument();
  });

  it("adds a value with its source", { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    renderApp({ path });
    await user.click(await screen.findByRole("button", { name: "Add value" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Add value" }));
    await user.type(dialog.getByLabelText("Item"), "Example well cost");
    await user.type(dialog.getByLabelText("Value"), "5");
    await user.type(dialog.getByLabelText("Source title"), "Example source");
    await user.type(dialog.getByLabelText("Publisher"), "Example Publisher");
    await user.type(dialog.getByLabelText("Year"), "2025");
    await user.type(dialog.getByLabelText("Page"), "3");
    await user.click(dialog.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Example well cost")).toBeVisible();
  });

  it("deletes a value after the confirmation", async () => {
    const user = userEvent.setup();
    renderApp({ path });
    await user.click(await screen.findByRole("button", { name: "Delete Example drilling cost" }));
    await user.click(await screen.findByRole("button", { name: "Yes, delete" }));
    expect(await screen.findByText("Value deleted")).toBeVisible();
    expect(screen.queryByText("Example drilling cost")).not.toBeInTheDocument();
  });

  it("shows past designs and opens one", async () => {
    const user = userEvent.setup();
    renderApp({ path });
    await user.click(await screen.findByRole("tab", { name: "Past designs" }));
    await user.click(await screen.findByRole("button", { name: "Open example-doublet-heat-pump" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("lcoh");
  });

  it("says so when the server does not offer the knowledge yet", async () => {
    server.use(
      http.get("*/api/v1/workspace/knowledge", () =>
        HttpResponse.json(
          { error: { code: "not_found", message: "Not Found", details: {} } },
          { status: 404 },
        ),
      ),
    );
    renderApp({ path });
    expect(await screen.findByText("This server does not offer the knowledge yet.")).toBeVisible();
  });

  it("reads but does not change the knowledge while the server has no memory", async () => {
    server.use(
      http.get("*/api/v1/workspace/knowledge/settings", () =>
        HttpResponse.json({
          sections: ["knowledge", "experience"],
          similarity: 0.8,
          available: false,
        }),
      ),
    );
    renderApp({ path });
    expect(await screen.findByText("Example drilling cost")).toBeVisible();
    expect(await screen.findByText(/memory is not on this server yet/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Add value" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Example drilling cost" }),
    ).not.toBeInTheDocument();
  });
});
