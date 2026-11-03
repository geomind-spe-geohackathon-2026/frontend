import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";

const slow = { timeout: 5000 };
const editor = "/projects/example-project-1/design/editor";

beforeAll(async () => {
  await import("./editor-page");
}, 30000);

describe("Editor page", () => {
  it("shows the plant, the chat dock and the study toolbar on one screen", async () => {
    renderApp({ path: editor });
    const plant = await screen.findByRole("region", { name: "Plant" }, slow);
    expect(
      await within(plant).findByRole("button", { name: "Start from template" }, slow),
    ).toBeVisible();
    expect(screen.getByRole("toolbar", { name: "Editor" })).toBeVisible();
    const dock = screen.getByRole("complementary", { name: "Chat dock" });
    expect(await within(dock).findByRole("button", { name: "New chat" }, slow)).toBeVisible();
  });

  it("opens and closes the results drawer from the toolbar", async () => {
    const { router } = renderApp({ path: editor });
    const toolbar = await screen.findByRole("toolbar", { name: "Editor" }, slow);
    expect(screen.queryByRole("region", { name: "Results drawer" })).toBeNull();
    await userEvent.click(within(toolbar).getByRole("button", { name: "Results" }));
    const drawer = await screen.findByRole("region", { name: "Results drawer" }, slow);
    expect(await within(drawer).findByRole("tab", { name: "Compare" }, slow)).toBeVisible();
    expect(router.state.location.search).toContain("results");
    await userEvent.click(within(toolbar).getByRole("button", { name: "Chat" }));
    expect(screen.queryByRole("complementary", { name: "Chat dock" })).toBeNull();
  });

  it("opens the New study dialog from Run study", async () => {
    renderApp({ path: editor });
    const toolbar = await screen.findByRole("toolbar", { name: "Editor" }, slow);
    await userEvent.click(within(toolbar).getByRole("button", { name: "Run study" }));
    expect(await screen.findByRole("dialog", { name: "New study" }, slow)).toBeVisible();
  });

  it("is the first page of the Design group in the sidebar", async () => {
    renderApp({ path: "/projects/example-project-1/overview" });
    const link = await screen.findByRole("link", { name: /Editor/ }, slow);
    expect(link).toHaveAttribute("href", editor);
  });
});
