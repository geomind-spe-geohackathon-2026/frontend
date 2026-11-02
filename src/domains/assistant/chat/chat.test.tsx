import { cleanup, configure, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { toRoute } from "@/mocks/url";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

configure({ asyncUtilTimeout: 10_000 });
vi.setConfig({ testTimeout: 20_000 });

const base = "/projects/example-project-1/assistant/chat";

async function sendMessage(text: string): Promise<void> {
  const user = userEvent.setup();
  await user.type(await screen.findByRole("textbox", { name: "Message" }), text);
  await user.click(screen.getByRole("button", { name: "Send" }));
}

describe("chat page", () => {
  it("lists the chats and replays the finished run with its tool cards and delegated agent", async () => {
    renderApp({ path: `${base}/example-chat-1` });
    expect(await screen.findByText("Which plant fits the example problem?")).toBeVisible();
    expect(await screen.findByText("read_case")).toBeVisible();
    expect(screen.getByText("size_plant")).toBeVisible();
    expect(screen.getByRole("region", { name: "Agent coordinator.designer" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Design the example plant/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect((await screen.findAllByText("done")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Open full log" })).toHaveAttribute(
      "href",
      "/projects/example-project-1/assistant/runs/example-run-1",
    );
  });

  it("shows the problem state the run built", async () => {
    renderApp({ path: `${base}/example-chat-1` });
    const panel = await screen.findByRole("heading", { name: "What it knows" });
    const card = panel.closest("div")?.parentElement;
    expect(card).not.toBeNull();
    await waitFor(() => {
      expect(within(card ?? document.body).getByText("Plant sized")).toBeVisible();
    });
  });

  it("asks for approval, continues after Approve and ends done", async () => {
    renderApp({ path: `${base}/example-chat-1` });
    await sendMessage("Check the uncertainty");
    const card = await screen.findByRole("region", { name: "Approval needed" });
    await userEvent.setup().click(within(card).getByRole("button", { name: "Approve" }));
    expect((await screen.findAllByText(/The study is queued/)).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.queryByRole("region", { name: "Approval needed" })).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("continues after Deny with the reason sent", async () => {
    renderApp({ path: `${base}/example-chat-1` });
    await sendMessage("Check the uncertainty");
    const card = await screen.findByRole("region", { name: "Approval needed" });
    const user = userEvent.setup();
    await user.type(within(card).getByLabelText("Reason (optional)"), "too expensive");
    await user.click(within(card).getByRole("button", { name: "Deny" }));
    expect((await screen.findAllByText(/I skip the study/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText("denied by the user").length).toBeGreaterThan(0);
  });

  it("cancels a run that waits for approval", async () => {
    renderApp({ path: `${base}/example-chat-1` });
    await sendMessage("Check the uncertainty");
    await screen.findByRole("region", { name: "Approval needed" });
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancel run" }));
    expect(await screen.findByText("Run cancelled")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Approval needed" })).toBeNull();
  });

  it("shows the same conversation after a reload as the live one", async () => {
    renderApp({ path: `${base}/example-chat-1` });
    await sendMessage("Check the uncertainty");
    const card = await screen.findByRole("region", { name: "Approval needed" });
    await userEvent.setup().click(within(card).getByRole("button", { name: "Approve" }));
    await screen.findAllByText(/The study is queued/);
    await waitFor(() => {
      expect(screen.getAllByText("done").length).toBeGreaterThan(1);
    });
    const live = document.querySelector("main")?.textContent;
    cleanup();
    renderApp({ path: `${base}/example-chat-1` });
    await screen.findAllByText(/The study is queued/);
    await waitFor(() => {
      expect(screen.getAllByText("done").length).toBeGreaterThan(1);
    });
    expect(document.querySelector("main")?.textContent).toBe(live);
  });

  it("starts a new chat from the first message", async () => {
    const { router } = renderApp({ path: base });
    expect(await screen.findByText(/New chat. Ask anything/)).toBeVisible();
    await sendMessage("A first question");
    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/assistant\/chat\/example-chat-2$/);
    });
    expect(await screen.findByText("A first question")).toBeVisible();
  });

  it("renames a chat in a dialog", async () => {
    renderApp({ path: `${base}/example-chat-1` });
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Rename Design the example plant" }),
    );
    const field = await screen.findByLabelText("Title");
    await user.clear(field);
    await user.type(field, "Renamed chat");
    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(await screen.findByRole("link", { name: /Renamed chat/ })).toBeVisible();
  });

  it("deletes a chat only after the in-page confirmation", async () => {
    renderApp({ path: `${base}/example-chat-1` });
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Delete Design the example plant" }),
    );
    expect(await screen.findByText(/This cannot be undone/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Delete chat" }));
    expect(await screen.findByText("No chats yet.")).toBeVisible();
  });

  it("shows a permission message when the chats are forbidden", async () => {
    server.use(
      http.get(toRoute("/assistant/chat"), () =>
        HttpResponse.json(
          { error: { code: "forbidden", message: "no", details: {} } },
          { status: 403 },
        ),
      ),
    );
    renderApp({ path: base });
    expect(await screen.findByText(/You do not have permission to see The chats/)).toBeVisible();
  });
});
