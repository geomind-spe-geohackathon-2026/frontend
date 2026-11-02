import { configure, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderApp } from "@/testing/render-app";

configure({ asyncUtilTimeout: 5000 });

const path = "/projects/example-project-1/settings";

describe("project settings", () => {
  it("renames the project and shows the new name in the sidebar", async () => {
    renderApp({ path });
    const user = userEvent.setup();
    const input = await screen.findByLabelText("Name");
    await user.clear(input);
    await user.type(input, "Example renamed plant");
    await user.click(screen.getByRole("button", { name: "Save name" }));
    expect(await screen.findByText("Project renamed")).toBeVisible();
    expect(await screen.findByText("Example renamed plant", { selector: "b" })).toBeVisible();
  });

  it("exports the zip", async () => {
    const download = vi.fn(() => "blob:example");
    Object.assign(URL, { createObjectURL: download, revokeObjectURL: vi.fn() });
    renderApp({ path });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Export zip" }));
    expect(await screen.findByText("Example district plant.zip exported")).toBeVisible();
    expect(download).toHaveBeenCalledOnce();
  });

  it("asks in the page before deleting and goes back to the projects", async () => {
    const { router } = renderApp({ path });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete project" }));
    expect(screen.getByText("This cannot be undone.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(await screen.findByRole("heading", { name: "Your projects" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/projects");
    expect(screen.queryByRole("link", { name: /Example district plant/ })).not.toBeInTheDocument();
  });

  it("hides the confirmation when the user keeps the project", async () => {
    renderApp({ path });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete project" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));
    expect(screen.queryByText("This cannot be undone.")).not.toBeInTheDocument();
  });
});
