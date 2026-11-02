import { configure, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

configure({ asyncUtilTimeout: 5000 });

const path = "/projects/example-project-1/documents";

describe("documents page", () => {
  it("lists documents with size and searchable status", async () => {
    renderApp({ path });
    const row = (await screen.findByText("example-requirements.pdf")).closest("tr");
    if (row === null) throw new Error("row missing");
    expect(within(row).getByText("156 KB")).toBeVisible();
    expect(within(row).getByText("searchable")).toBeVisible();
  });

  it("uploads a file and shows it as indexing", async () => {
    renderApp({ path });
    const user = userEvent.setup();
    const file = new File(["text"], "example-datasheet.pdf", { type: "application/pdf" });
    await user.upload(await screen.findByLabelText("Document file"), file);
    expect(await screen.findByText("indexing")).toBeVisible();
    expect(screen.getByText("example-datasheet.pdf uploaded")).toBeVisible();
  });

  it("deletes a document after the confirmation", async () => {
    renderApp({ path });
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Delete example-requirements.pdf" }),
    );
    await user.click(await screen.findByRole("button", { name: "Yes, delete" }));
    expect(
      await screen.findByText("No documents yet. Upload a file for the assistant to search."),
    ).toBeVisible();
  });

  it("keeps the document when the deletion is cancelled", async () => {
    renderApp({ path });
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Delete example-requirements.pdf" }),
    );
    await user.click(await screen.findByRole("button", { name: "Keep it" }));
    expect(screen.getByText("example-requirements.pdf")).toBeVisible();
  });

  it("shows the empty state for a project without documents", async () => {
    renderApp({ path: "/projects/example-project-2/documents" });
    expect(await screen.findByText(/No documents yet/)).toBeVisible();
  });

  it("shows the server error", async () => {
    server.use(
      http.get("*/api/v1/workspace/documents", () =>
        HttpResponse.json(
          { error: { code: "internal", message: "Storage is down", details: {} } },
          { status: 500 },
        ),
      ),
    );
    renderApp({ path });
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage is down");
  });
});
