import { expect, test } from "@playwright/test";

const project = "/projects/example-project-1";
const routes = [
  "/projects",
  "/account",
  "/users",
  project,
  `${project}/assistant/chat`,
  `${project}/assistant/runs`,
  `${project}/design/case`,
  `${project}/design/plant`,
  `${project}/design/study`,
  `${project}/design/results`,
  `${project}/design/report?result=example-result-1`,
  `${project}/documents`,
  `${project}/settings`,
];

test.use({ viewport: { width: 390, height: 844 } });

test("no main page scrolls sideways on a phone", async ({ page }) => {
  await page.goto("/projects");
  await page.getByLabel("Email").fill("example-admin@example.test");
  await page.getByLabel("Password").fill("example-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Your projects" })).toBeVisible();
  const wide: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    if (width > 390) wide.push(`${route}: ${String(width)}`);
  }
  expect(wide).toEqual([]);
});
