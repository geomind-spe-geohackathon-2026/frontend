import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { exampleMember } from "@/mocks/identity";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

describe("users page", () => {
  it("lists the users with role and status and no action on the own row", async () => {
    renderApp({ path: "/users" });
    const row = (await screen.findByText(exampleMember.user.email)).closest("tr");
    expect(row).not.toBeNull();
    if (row === null) return;
    expect(within(row).getByText("active")).toBeVisible();
    expect(within(row).getByRole("button", { name: "Deactivate" })).toBeVisible();
    const own = screen.getByText("example-admin@example.test").closest("tr");
    expect(own).not.toBeNull();
    if (own === null) return;
    expect(within(own).queryByRole("button")).not.toBeInTheDocument();
  });

  it("deactivates and activates a user", async () => {
    renderApp({ path: "/users" });
    const user = userEvent.setup();
    const row = (await screen.findByText(exampleMember.user.email)).closest("tr");
    if (row === null) throw new Error("row missing");
    await user.click(within(row).getByRole("button", { name: "Deactivate" }));
    expect(await within(row).findByText("inactive")).toBeVisible();
    await user.click(within(row).getByRole("button", { name: "Activate" }));
    expect(await within(row).findByText("active")).toBeVisible();
  });

  it("adds a user from the dialog and shows the row", async () => {
    renderApp({ path: "/users" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Add user" }));
    await user.type(screen.getByLabelText("Name"), "Example Guest");
    await user.type(screen.getByLabelText("Email"), "example-guest@example.test");
    await user.type(screen.getByLabelText("First password"), "example-password");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("example-guest@example.test")).toBeVisible();
    expect(screen.getByText("User created")).toBeVisible();
  });

  it("shows the conflict message when the email exists", async () => {
    renderApp({ path: "/users" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Add user" }));
    await user.type(screen.getByLabelText("Name"), "Copy");
    await user.type(screen.getByLabelText("Email"), exampleMember.user.email);
    await user.type(screen.getByLabelText("First password"), "example-password");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A user with this email exists");
  });

  it("shows a permission message when the server answers forbidden", async () => {
    server.use(
      http.get("*/api/v1/identity/users", () =>
        HttpResponse.json(
          { error: { code: "forbidden", message: "No", details: {} } },
          { status: 403 },
        ),
      ),
    );
    renderApp({ path: "/users" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Only admins can manage users.");
  });

  it("shows the server error", async () => {
    server.use(
      http.get("*/api/v1/identity/users", () =>
        HttpResponse.json(
          { error: { code: "internal", message: "Database is down", details: {} } },
          { status: 500 },
        ),
      ),
    );
    renderApp({ path: "/users" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Database is down");
  });
});
