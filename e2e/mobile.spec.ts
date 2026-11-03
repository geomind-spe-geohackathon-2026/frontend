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
  `${project}/library`,
  `${project}/settings`,
];

function toClipped(): string[] {
  const found: string[] = [];
  for (const box of document.querySelectorAll("[data-table-scroll]")) {
    const overflows = box.scrollWidth > box.clientWidth + 1;
    const scrolls = ["auto", "scroll"].includes(getComputedStyle(box).overflowX);
    if (overflows && !scrolls) found.push("a table box does not scroll");
    if (overflows && box.parentElement?.querySelector("[data-table-fade]") === null) {
      found.push("a wide table has no fade");
    }
  }
  for (const table of document.querySelectorAll("table")) {
    if (table.closest("[data-table-scroll]") === null) found.push("a table cannot scroll");
  }
  for (const cell of document.querySelectorAll("td, th")) {
    const hidden = ["hidden", "clip"].includes(getComputedStyle(cell).overflowX);
    if (hidden && cell.scrollWidth > cell.clientWidth + 1) found.push("a cell hides its content");
  }
  return found;
}

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
    const clipped = await page.evaluate(toClipped);
    wide.push(...clipped.map((item) => `${route}: ${item}`));
  }
  expect(wide).toEqual([]);
});
