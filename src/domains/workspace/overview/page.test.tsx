import { configure, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

configure({ asyncUtilTimeout: 5000 });

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

  it("creates a chat with the first message and opens it", async () => {
    const sent: unknown[] = [];
    server.use(
      http.post("*/api/v1/assistant/chat", () =>
        HttpResponse.json(
          { id: "chat-new", project: "example-project-1", title: "", created: "", last_run: null },
          { status: 201 },
        ),
      ),
      http.post("*/api/v1/assistant/chat/chat-new/messages", async ({ request }) => {
        sent.push(await request.json());
        return HttpResponse.json(
          { message: { id: "m1", chat: "chat-new" }, run: { id: "run-new" } },
          { status: 201 },
        );
      }),
    );
    const { router } = renderApp({ path: `${base}/overview` });
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText("Ask the assistant", { selector: "input" }),
      "Design it",
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));
    await screen.findByRole("heading", { name: "Chat" });
    expect(router.state.location.pathname).toBe(`${base}/assistant/chat/chat-new`);
    expect(sent).toEqual([{ content: "Design it" }]);
  });

  it("does not send an empty question", async () => {
    renderApp({ path: `${base}/overview` });
    expect(await screen.findByRole("button", { name: "Ask" })).toBeDisabled();
  });
});
