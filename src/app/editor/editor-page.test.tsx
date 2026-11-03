import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { plantKeys } from "@/domains/design/plant/api";
import type { Study, Version } from "@/shared/api/types";
import { exampleAdmin } from "@/mocks/identity";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

const slow = { timeout: 5000 };

function toStudy(status: Study["status"]): Study {
  return {
    id: "example-study-1",
    project: "example-project-1",
    kind: "size",
    name: "Example size study",
    settings: {},
    status,
    progress: { done: status === "done" ? 1 : 0, total: 1 },
    started_by: { kind: "user", name: "Example Admin", run: null },
    case_version: 2,
    plant_version: 3,
    result: status === "done" ? "example-result-1" : null,
    error: null,
    missing: [],
    created: "2026-01-12T14:00:00Z",
    ended: status === "done" ? "2026-01-12T14:03:00Z" : null,
  };
}
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
    const sidebar = await screen.findByRole("navigation", { name: "Project" }, slow);
    expect(within(sidebar).getByRole("link", { name: "Editor" })).toHaveAttribute("href", editor);
  });

  it("opens from the Overview", async () => {
    renderApp({ path: "/projects/example-project-1/overview" });
    const link = await screen.findByRole("link", { name: "Open editor" }, slow);
    expect(link).toHaveAttribute("href", editor);
  });

  it("says when the agent saved a new plant version and opens the history", async () => {
    const own = {
      number: 1,
      note: "First plant",
      created: "2027-01-01T00:00:00Z",
      author: { id: exampleAdmin.user.id, name: exampleAdmin.user.name },
    };
    const agent = {
      number: 2,
      note: "Added a heat pump",
      created: "2027-01-02T00:00:00Z",
      author: { id: "example-agent", name: "designer" },
    };
    let items: Version[] = [own];
    server.use(
      http.get("*/api/v1/plant/flowsheet/versions", () => HttpResponse.json({ items, next: null })),
    );
    const { queryClient, router } = renderApp({ path: editor });
    const key = plantKeys.versions("example-project-1");
    await waitFor(() => {
      expect(queryClient.getQueryData(key)).toBeDefined();
    }, slow);
    items = [agent, own];
    await act(() => queryClient.invalidateQueries({ queryKey: key }));
    const notice = await screen.findByText(/designer saved plant version 2/, {}, slow);
    expect(notice).toHaveTextContent("Added a heat pump");
    await userEvent.click(screen.getByRole("button", { name: "Show history" }));
    await waitFor(() => {
      expect(router.state.location.search).toContain("tab=history");
    }, slow);
  }, 15000);

  it("keeps the plant read-only while a study runs", async () => {
    server.use(
      http.get("*/api/v1/design/study", () =>
        HttpResponse.json({ items: [toStudy("running")], next: null }),
      ),
    );
    renderApp({ path: editor });
    expect(await screen.findByText(/plant is read-only until it ends/, {}, slow)).toBeVisible();
    const plant = screen.getByRole("region", { name: "Plant" });
    expect(plant.querySelector("[inert]")).not.toBeNull();
    expect(screen.queryByRole("region", { name: "Module results" })).toBeNull();
  });

  it("shows each module's key result and selects the module on a click", async () => {
    server.use(
      http.get("*/api/v1/design/study", () =>
        HttpResponse.json({ items: [toStudy("done")], next: null }),
      ),
    );
    const { router } = renderApp({ path: editor });
    const strip = await screen.findByRole("region", { name: "Module results" }, slow);
    const chip = await within(strip).findByRole("button", { name: /Heat .*MW/ }, slow);
    expect(screen.getByRole("region", { name: "Plant" }).querySelector("[inert]")).toBeNull();
    await userEvent.click(chip);
    await waitFor(() => {
      expect(router.state.location.search).toContain("module=heat");
    }, slow);
  });
});
