import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";

const path = "/connectors";

describe("connectors page", () => {
  it("lists a connector with its status and tools", async () => {
    const user = userEvent.setup();
    renderApp({ path });
    expect(await screen.findByText("example-weather")).toBeVisible();
    expect(screen.getByText("connected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tools of example-weather" }));
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("hourly_temperature")).toBeVisible();
    expect(dialog.getByText("read only")).toBeVisible();
  });

  it("adds a connector with a token", { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    renderApp({ path });
    await user.click(await screen.findByRole("button", { name: "Add connector" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Add connector" }));
    await user.type(dialog.getByLabelText("Name"), "example-database");
    await user.type(dialog.getByLabelText("Server URL"), "https://example.com/db");
    await user.selectOptions(dialog.getByLabelText("Sign-in"), "bearer");
    await user.type(dialog.getByLabelText("Token"), "example-token");
    await user.click(dialog.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("example-database")).toBeVisible();
  });

  it("turns a connector off and removes it", async () => {
    const user = userEvent.setup();
    renderApp({ path });
    const on = await screen.findByRole("checkbox", { name: "On" });
    expect(on).toBeChecked();
    await user.click(on);
    expect(await screen.findByRole("checkbox", { name: "On" })).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Remove example-weather" }));
    expect(await screen.findByText("No connectors yet.")).toBeVisible();
  });
});
