import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter, Link } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { UnsavedChangesDialog, useUnsavedGuard } from "./unsaved-guard";

function Editor({ dirty }: { dirty: boolean }) {
  const blocker = useUnsavedGuard(dirty);
  return (
    <>
      <Link to="/other">Go</Link>
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

function renderEditor(dirty: boolean) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <Editor dirty={dirty} /> },
      { path: "/other", element: <p>other page</p> },
    ],
    { initialEntries: ["/"] },
  );
  render(<RouterProvider router={router} />);
}

describe("unsaved changes guard", () => {
  it("asks before leaving and stays when asked to", async () => {
    renderEditor(true);
    await userEvent.click(screen.getByRole("link", { name: "Go" }));
    expect(screen.getByRole("dialog", { name: "Unsaved changes" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Stay on this page" }));
    expect(screen.queryByText("other page")).toBeNull();
  });

  it("leaves when confirmed", async () => {
    renderEditor(true);
    await userEvent.click(screen.getByRole("link", { name: "Go" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave and discard" }));
    expect(await screen.findByText("other page")).toBeVisible();
  });

  it("does not ask when nothing changed", async () => {
    renderEditor(false);
    await userEvent.click(screen.getByRole("link", { name: "Go" }));
    expect(await screen.findByText("other page")).toBeVisible();
  });
});
