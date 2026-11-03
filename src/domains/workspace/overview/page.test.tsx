import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

const base = "/projects/example-project-1";

describe("overview page", () => {
  it("shows the stepper with state chips that open each page", async () => {
    renderApp({ path: `${base}/overview` });
    const problem = await screen.findByRole("link", { name: /Demand, site/ });
    expect(problem).toHaveAttribute("href", `${base}/design/case`);
    expect(problem).toHaveTextContent("complete");
    expect(screen.getByRole("link", { name: /Size, optimise/ })).toHaveTextContent("1 running");
    expect(screen.getByRole("link", { name: /Deliverable/ })).toHaveAttribute(
      "href",
      `${base}/design/report`,
    );
  });

  it("lists recent chats and links the activity rows", async () => {
    renderApp({ path: `${base}/overview` });
    const chat = await screen.findByRole("link", { name: "Example design conversation" });
    expect(chat).toHaveAttribute("href", `${base}/assistant/chat/example-chat-1`);
    const row = chat.closest("li");
    if (row === null) throw new Error("row missing");
    expect(within(row).getByText("running")).toBeVisible();
    expect(screen.getByRole("link", { name: "Example Admin saved plant v3" })).toHaveAttribute(
      "href",
      `${base}/design/plant`,
    );
  });

  it("shows the empty messages for a project with no chats or activity", async () => {
    renderApp({ path: "/projects/example-project-2/overview" });
    expect(await screen.findByText(/No chats yet/)).toBeVisible();
    expect(screen.getByText("Nothing has happened in this project yet.")).toBeVisible();
  });

  it("shows the server error", async () => {
    server.use(
      http.get("*/api/v1/workspace/overview", () =>
        HttpResponse.json(
          { error: { code: "internal", message: "Database is down", details: {} } },
          { status: 500 },
        ),
      ),
    );
    renderApp({ path: `${base}/overview` });
    expect(await screen.findByRole("alert")).toHaveTextContent("Database is down");
  });
});
