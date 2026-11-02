import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { exampleAdmin } from "@/mocks/identity";
import { renderApp } from "@/testing/render-app";

describe("account page", () => {
  it("shows the profile of the signed-in user", async () => {
    renderApp({ path: "/account" });
    expect(await screen.findByText(exampleAdmin.user.email)).toBeVisible();
    expect(screen.getByText(exampleAdmin.user.name)).toBeVisible();
  });

  it("shows the server error for a wrong current password and stays signed in", async () => {
    renderApp({ path: "/account" });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Current password"), "wrong-password");
    await user.type(screen.getByLabelText("New password"), "another-example-password");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The current password is wrong");
    expect(screen.getByRole("heading", { name: "Account" })).toBeVisible();
  });

  it("signs out everywhere after a password change", async () => {
    renderApp({ path: "/account" });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Current password"), exampleAdmin.password);
    await user.type(screen.getByLabelText("New password"), "another-example-password");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(screen.getByText("Password changed. Please sign in again.")).toBeVisible();
  });
});
