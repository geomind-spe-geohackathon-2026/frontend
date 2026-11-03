import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";

const path = "/knowledge";

describe("knowledge page", () => {
  it("lists the shared documents, not a project's Library", async () => {
    renderApp({ path });
    expect(await screen.findByRole("heading", { level: 1, name: "Knowledge" })).toBeVisible();
    expect(await screen.findByText("example-cost-catalogue.pdf")).toBeVisible();
    expect(screen.queryByText("example-requirements.pdf")).not.toBeInTheDocument();
  });

  it("uploads a shared document and shows it as indexing", { timeout: 20_000 }, async () => {
    renderApp({ path });
    const user = userEvent.setup();
    const file = new File(["text"], "example-standard.pdf", { type: "application/pdf" });
    await screen.findByText("example-cost-catalogue.pdf");
    await user.upload(screen.getByLabelText("Document file"), file);
    expect(await screen.findByText("example-standard.pdf uploaded")).toBeVisible();
    expect(await screen.findByText("indexing", {}, { timeout: 5_000 })).toBeVisible();
  });

  it("opens a file in a window from its View button", async () => {
    renderApp({ path });
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "View example-cost-catalogue.pdf" }),
    );
    expect(await screen.findByRole("dialog", { name: "example-cost-catalogue.pdf" })).toBeVisible();
    expect(await screen.findByText("Example text of example-cost-catalogue.pdf")).toBeVisible();
  });
});
