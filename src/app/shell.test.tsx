import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { exampleMember } from "@/mocks/identity";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

const base = "/projects/example-project-1";

describe("auth guard", () => {
  it("sends a signed-out visitor to sign in and remembers the target", async () => {
    const { router } = renderApp({ path: `${base}/design/plant`, signedIn: false });
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/signin");
    expect(router.state.location.search).toBe(
      `?next=${encodeURIComponent(`${base}/design/plant`)}`,
    );
  });

  it("shows an error for wrong credentials and stays on the page", async () => {
    renderApp({ path: "/signin", signedIn: false });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "someone@example.test");
    await user.type(screen.getByLabelText("Password"), "not-the-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password");
  });

  it("signs in and returns to the page the visitor was going to", async () => {
    const { router } = renderApp({
      path: `/signin?next=${encodeURIComponent("/account")}`,
      signedIn: false,
    });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), exampleMember.user.email);
    await user.type(screen.getByLabelText("Password"), exampleMember.password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/account");
  });

  it("ignores a next target that leaves the app", async () => {
    const { router } = renderApp({
      path: `/signin?next=${encodeURIComponent("//evil.example")}`,
      signedIn: true,
    });
    expect(await screen.findByRole("heading", { name: "Your projects" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects");
  });

  it("signs out through the user menu and goes back to sign in", async () => {
    renderApp({ path: "/projects" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "User menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows a permission message on the users page to a member", async () => {
    renderApp({ path: "/users", user: exampleMember.user.id });
    expect(await screen.findByRole("heading", { name: "No permission" })).toBeInTheDocument();
  });

  it("shows the users page to an admin", async () => {
    renderApp({ path: "/users" });
    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
  });
});

describe("shell levels", () => {
  it("has the main sidebar and no project sidebar on the projects home", async () => {
    renderApp({ path: "/projects" });
    expect(await screen.findByRole("heading", { name: "Your projects" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Project" })).not.toBeInTheDocument();
  });

  it("sends the root path to the projects home", async () => {
    const { router } = renderApp({ path: "/" });
    expect(await screen.findByRole("heading", { name: "Your projects" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects");
  });

  it("opens the chat from a project path and shows the sidebar and breadcrumb", async () => {
    const { router } = renderApp({ path: base });
    expect(await screen.findByRole("heading", { level: 1, name: "Chat" })).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/assistant\/chat\/example-chat-\d$/);
    });
    const sidebar = screen.getByRole("navigation", { name: "Project" });
    expect(within(sidebar).getByRole("link", { name: /Overview/ })).toBeInTheDocument();
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByText("Example district plant")).toBeInTheDocument();
  });

  it("shows the progress label next to each design step", { timeout: 20_000 }, async () => {
    renderApp({ path: `${base}/design/case` });
    const steps = await screen.findByRole("tablist", { name: "Design steps" });
    expect(within(steps).getByRole("tab", { name: /Study.*1 running/ })).toBeInTheDocument();
  });

  it("hides the operation entries unless the flag is on", async () => {
    renderApp({ path: "/projects/example-project-1/overview" });
    await screen.findByRole("link", { name: /Runs and logs/ });
    expect(screen.queryByText("Time series")).toBeNull();
  });

  it("goes back to the projects with a message for an unknown project", async () => {
    const { router } = renderApp({ path: "/projects/does-not-exist/overview" });
    expect(await screen.findByRole("heading", { name: "Your projects" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects");
    expect(screen.getByText(/does not exist or you cannot see it/)).toBeVisible();
  });

  it("shows the server error inside a project when loading it fails for another reason", async () => {
    server.use(
      http.get("*/api/v1/workspace/projects/:projectId", () =>
        HttpResponse.json(
          { error: { code: "internal", message: "Database is down", details: {} } },
          { status: 500 },
        ),
      ),
    );
    renderApp({ path: `${base}/overview` });
    expect(await screen.findByRole("alert")).toHaveTextContent("Database is down");
  });

  it("shows the active run pill and links to the running chat", async () => {
    server.use(
      http.get("*/api/v1/assistant/runs", () =>
        HttpResponse.json({
          items: [
            {
              id: "run-1",
              chat: "chat-1",
              project: "example-project-1",
              status: "running",
              loop: "design",
              started: "2026-01-12T14:30:00Z",
              ended: null,
            },
          ],
          next: null,
        }),
      ),
    );
    renderApp({ path: `${base}/overview` });
    const pill = await screen.findByRole("link", { name: "1 run active" });
    expect(pill).toHaveAttribute("href", `${base}/assistant/chat/chat-1`);
  });
});

describe("project routes", () => {
  const pages: [string, string][] = [
    ["overview", "Overview"],
    ["assistant/chat", "Chat"],
    ["assistant/chat/chat-1", "Chat"],
    ["assistant/runs", "Runs and logs"],
    ["assistant/runs/run-1", "Run log"],
    ["design/case", "Case"],
    ["design/plant", "Plant"],
    ["design/study", "Study"],
    ["design/results", "Results"],
    ["design/results/result-1", "Results"],
    ["design/report", "Report"],
    ["library", "Library"],
    ["settings", "Project settings"],
  ];

  it.each(pages)("renders %s with its page heading", async (route, heading) => {
    renderApp({ path: `${base}/${route}` });
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });

  it("renders the account page on the home level", async () => {
    renderApp({ path: "/account" });
    expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Project" })).not.toBeInTheDocument();
  });

  it("falls back to the projects home for an unknown path", async () => {
    const { router } = renderApp({ path: "/nowhere" });
    expect(await screen.findByRole("heading", { name: "Your projects" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/projects");
  });
});

describe("theme", () => {
  it("applies and remembers the chosen theme", async () => {
    renderApp({ path: "/projects" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "User menu" }));
    (await screen.findByRole("menuitem", { name: "Theme" })).focus();
    await user.keyboard("{ArrowRight}");
    (await screen.findByRole("menuitemradio", { name: "Dark" })).focus();
    await user.keyboard("{Enter}");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("geomind.theme")).toBe("dark");
  });
});
