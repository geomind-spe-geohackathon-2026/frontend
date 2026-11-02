import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";

const path = "/projects/example-project-1/design/study";

describe("StudyPage", () => {
  it("lists studies and shows a running study without a percentage", async () => {
    renderApp({ path });
    const row = await screen.findByRole("row", { name: /Example minimize study/ });
    const bar = within(row).getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(within(row).getByText("in progress")).toBeVisible();
  });

  it("links a finished study to its result", async () => {
    renderApp({ path });
    const row = await screen.findByRole("row", { name: /Example size study/ });
    expect(within(row).getByRole("link", { name: "Open result" })).toHaveAttribute(
      "href",
      "/projects/example-project-1/design/results/example-result-1",
    );
  });

  it("shows what a blocked study misses and starts it", async () => {
    const user = userEvent.setup();
    renderApp({ path });
    const row = await screen.findByRole("row", { name: /Example sensitivity study/ });
    expect(within(row).getByText(/economics\.example_price/)).toBeVisible();
    await user.click(within(row).getByRole("button", { name: /Start/ }));
    expect(await screen.findByText("queued")).toBeVisible();
  });

  it("creates a study from a kind and its settings form", async () => {
    const user = userEvent.setup();
    renderApp({ path });
    await user.click(await screen.findByRole("button", { name: "New study" }));
    const dialog = await screen.findByRole("dialog", { name: "New study" });
    const create = within(dialog).getByRole("button", { name: "Create study" });
    expect(create).toBeDisabled();
    await user.selectOptions(await within(dialog).findByLabelText("Kind"), "size");
    await user.type(within(dialog).getByLabelText("Name"), "My study");
    await user.type(within(dialog).getByLabelText("Number of runs"), "5");
    expect(within(dialog).getByLabelText(/^Horizon/)).toHaveValue(null);
    await user.click(create);
    expect(await screen.findByRole("row", { name: /My study/ })).toBeVisible();
  });
});
