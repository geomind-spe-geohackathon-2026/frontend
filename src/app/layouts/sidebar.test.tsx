import { screen, within } from "@testing-library/react";
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
    renderApp({ path: "/projects/example-project-1/design/case" });
    const nav = within(await screen.findByRole("navigation", { name: "Project" }));
    expect(nav.getByRole("link", { name: /1 Case/ })).toHaveAttribute("data-active", "true");
    expect(nav.getByRole("link", { name: /2 Plant/ })).toHaveAttribute("data-active", "false");
  });
});
