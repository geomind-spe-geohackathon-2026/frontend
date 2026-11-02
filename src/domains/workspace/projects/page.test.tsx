import { configure, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

configure({ asyncUtilTimeout: 5000 });

describe("projects home", () => {
  it("shows a card per project with owner and progress", async () => {
    renderApp({ path: "/projects" });
    const card = await screen.findByRole("link", { name: /Example district plant/ });
    expect(card).toHaveAttribute("href", "/projects/example-project-1/overview");
    expect(card).toHaveTextContent("Owner Example Admin");
    expect(card).toHaveTextContent("Problem: complete");
    expect(screen.getByRole("link", { name: /Example campus plant/ })).toHaveTextContent(
      "Problem: 2 missing",
    );
  });

  it("filters by name from the search box and keeps the search in the URL", async () => {
    const { router } = renderApp({ path: "/projects" });
    const user = userEvent.setup();
    await user.type(await screen.findByRole("searchbox", { name: "Search projects" }), "campus");
    await screen.findByRole("link", { name: /Example campus plant/ });
    expect(screen.queryByRole("link", { name: /Example district plant/ })).not.toBeInTheDocument();
    expect(router.state.location.search).toBe("?q=campus");
  });

  it("says so when no project matches", async () => {
    renderApp({ path: "/projects?q=zzz" });
    expect(await screen.findByText("No project matches.")).toBeVisible();
  });

  it("shows the first-use message when there are no projects", async () => {
    server.use(
      http.get("*/api/v1/workspace/projects", () => HttpResponse.json({ items: [], next: null })),
    );
    renderApp({ path: "/projects" });
    expect(await screen.findByText("No projects yet. Create the first one.")).toBeVisible();
    expect(screen.getByRole("button", { name: "+ New project" })).toBeVisible();
  });

  it("shows the server error", async () => {
    server.use(
      http.get("*/api/v1/workspace/projects", () =>
        HttpResponse.json(
          { error: { code: "internal", message: "Database is down", details: {} } },
          { status: 500 },
        ),
      ),
    );
    renderApp({ path: "/projects" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Database is down");
  });

  it("creates a project from the dialog and opens its overview", async () => {
    const { router } = renderApp({ path: "/projects" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "+ New project" }));
    await user.type(screen.getByLabelText("Name"), "Example new plant");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("heading", { name: "Overview" })).toBeVisible();
    expect(router.state.location.pathname).toMatch(/^\/projects\/example-project-3\/overview$/);
    expect(screen.getByText("Project created")).toBeVisible();
  });

  it("imports a project zip and opens its overview", async () => {
    const { router } = renderApp({ path: "/projects" });
    const user = userEvent.setup();
    const file = new File(["zip"], "example-import.zip", { type: "application/zip" });
    await user.upload(await screen.findByLabelText("Project zip file"), file);
    expect(await screen.findByRole("heading", { name: "Overview" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/projects/example-project-3/overview");
  });

  it("offers a project zip in the dialog instead of a name", async () => {
    renderApp({ path: "/projects" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "+ New project" }));
    await user.click(screen.getByRole("radio", { name: "A project zip" }));
    expect(screen.getByLabelText("Project zip")).toBeVisible();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });
});
