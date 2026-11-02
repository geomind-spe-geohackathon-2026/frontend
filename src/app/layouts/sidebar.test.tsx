import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";

describe("project sidebar", () => {
  it("opens from the menu button and closes after a link is chosen", async () => {
    const user = userEvent.setup();
    renderApp({ path: "/projects/example-project-1/overview" });
    const menu = await screen.findByRole("button", { name: "Menu" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    await user.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("link", { name: "Chat" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });
});
