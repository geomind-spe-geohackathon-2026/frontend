import { expect, test } from "@playwright/test";

test("signs in against the mock API and opens a project", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeAttached();
  await page.getByLabel("Email").fill("example-admin@example.test");
  await page.getByLabel("Password").fill("example-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Your projects" })).toBeVisible();
  await page.goto("/projects/example-project-1");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
});
