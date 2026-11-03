import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";

describe("project sidebar", () => {
  it("collapses to icons from the trigger and opens again", async () => {
    const user = userEvent.setup();
    renderApp({ path: "/projects/example-project-1/overview" });
    await screen.findByRole("navigation", { name: "Project" });
    const toggle = document.querySelector('[data-sidebar="trigger"]');
    if (toggle === null) throw new Error("no sidebar trigger");
    expect(toggle).toHaveAccessibleName("Toggle Sidebar");
    const sidebar = document.querySelector('[data-slot="sidebar"]');
    expect(sidebar).toHaveAttribute("data-state", "expanded");
    await user.click(toggle);
    expect(sidebar).toHaveAttribute("data-state", "collapsed");
    expect(sidebar).toHaveAttribute("data-collapsible", "icon");
    await user.click(toggle);
    expect(sidebar).toHaveAttribute("data-state", "expanded");
  });

  it("marks the current page in the sidebar", async () => {
    renderApp({ path: "/projects/example-project-1/library" });
    const nav = within(await screen.findByRole("navigation", { name: "Project" }));
    expect(nav.getByRole("link", { name: /Library/ })).toHaveAttribute("data-active", "true");
    expect(nav.getByRole("link", { name: /Overview/ })).toHaveAttribute("data-active", "false");
  });

  it("opens a design step in the Design panel next to the chat", { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/projects/example-project-1/design/case" });
    const steps = within(await screen.findByRole("tablist", { name: "Design steps" }));
    expect(steps.getByRole("tab", { name: /Case/ })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("heading", { level: 2, name: "Chat" })).toBeInTheDocument();
    await user.click(steps.getByRole("tab", { name: /Plant/ }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/projects/example-project-1/design/plant");
    });
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/assistant\/chat/);
    });
  });

  it("pins a chat from its menu and lists it under Pinned", async () => {
    const user = userEvent.setup();
    renderApp({ path: "/projects/example-project-1/overview" });
    const chats = within(await screen.findByRole("navigation", { name: "Chats" }));
    await user.click(
      await chats.findByRole("button", { name: "Actions of Design the example plant" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Pin" }));
    const pinned = within(await screen.findByRole("navigation", { name: "Pinned" }));
    expect(pinned.getByRole("link", { name: /Design the example plant/ })).toBeInTheDocument();
  });
});
