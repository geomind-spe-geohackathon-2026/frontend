import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const real = {
  email: process.env.E2E_EMAIL ?? "admin@example.com",
  password: process.env.E2E_PASSWORD ?? "example-password",
  source: "Example project",
};
const mock = {
  email: "example-admin@example.test",
  password: "example-password",
  source: "Example district plant",
};

let step = 0;

async function shot(page: Page, mode: string, name: string): Promise<void> {
  step += 1;
  await page.waitForTimeout(800);
  const folder = `.tmp/build/screens/${mode}`;
  mkdirSync(folder, { recursive: true });
  await page.screenshot({
    path: `${folder}/${String(step).padStart(2, "0")}-${name}.png`,
    fullPage: true,
  });
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Your projects" })).toBeVisible();
}

async function importExample(page: Page, source: string, name: string): Promise<void> {
  await page.getByText(source, { exact: true }).first().click();
  await page.getByRole("link", { name: "Project settings" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export zip" }).first().click();
  const archive = await (await download).path();
  await page.getByRole("link", { name: "Projects", exact: true }).first().click();
  await page.getByRole("button", { name: "Import zip" }).click();
  await page.locator("input[type=file]").setInputFiles(archive);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.getByRole("link", { name: "Project settings" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Save name" }).click();
}

async function createEmpty(page: Page, name: string): Promise<void> {
  await page.getByText("+ New project").click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

async function openFixture(page: Page, name: string): Promise<void> {
  await page.getByRole("link", { name: "Switch project" }).click();
  await page.getByText(name, { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

test("golden path", async ({ page }, info) => {
  const mode = info.project.name;
  const login = mode === "real" ? real : mock;
  step = 0;
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeAttached();
  await shot(page, mode, "signin");
  await signIn(page, login.email, login.password);
  await shot(page, mode, "projects");

  if (mode === "real") await importExample(page, login.source, "Golden project");
  else await createEmpty(page, "Golden project");
  await page.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await shot(page, mode, "overview");
  if (mode === "mock") await openFixture(page, login.source);

  await page.getByRole("link", { name: "Chat", exact: true }).click();
  await page.getByLabel("Message").fill("Please save a demand profile for heating");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("button", { name: "Approve" })).toBeVisible({ timeout: 60_000 });
  await shot(page, mode, "chat-approval");
  if (mode === "real") {
    await page.reload();
    await expect(page.getByRole("button", { name: "Approve" })).toBeVisible({ timeout: 60_000 });
  }
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("button", { name: "Approve" })).toBeHidden({ timeout: 60_000 });
  await shot(page, mode, "chat-approved");

  await page.getByRole("link", { name: "Runs and logs" }).click();
  await shot(page, mode, "runs");
  await page.getByRole("row").nth(1).getByRole("link").first().click();
  await shot(page, mode, "run-log");

  await page.getByRole("link", { name: "1 Case" }).click();
  await expect(page.getByText(/\d+ values? missing/)).toBeVisible();
  await shot(page, mode, "problem-missing");
  if (mode === "mock") await page.getByRole("tab", { name: "Economics" }).click();
  const fills = mode === "real" ? { Thickness: "100" } : { "Gas price": "5", "Discount rate": "5" };
  for (const [label, value] of Object.entries(fills)) {
    await page.getByLabel(label).first().fill(value);
  }
  await expect(page.getByText(/\d+ values? missing/)).toBeHidden();
  await page.getByRole("button", { name: "Save version" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Save version" }).click();
  await expect(page.getByText(/Case v\d+ saved/)).toBeVisible();
  await shot(page, mode, "problem-filled");

  await page.getByRole("link", { name: "2 Plant" }).click();
  await expect(page.getByRole("tab", { name: "Flowsheet" })).toBeVisible();
  await expect(page.locator(".react-flow__node").first()).toBeVisible();
  await expect(page.locator(".react-flow__edge").first()).toBeAttached();
  await shot(page, mode, "plant");

  await page.getByRole("link", { name: "3 Study" }).click();
  await page.getByRole("button", { name: "New study" }).click();
  await page.getByLabel("Kind").selectOption({ index: mode === "mock" ? 3 : 1 });
  await page.getByLabel("Name").fill("Golden study");
  await shot(page, mode, "study-dialog");
  await page.getByRole("button", { name: /^(Start|Create)/ }).click();
  await expect(page.getByRole("row", { name: /Golden study/ })).toContainText("done", {
    timeout: 240_000,
  });
  await shot(page, mode, "study");

  await page.getByRole("link", { name: "4 Results" }).click();
  await expect(page.getByText(/Loading results/)).toBeHidden();
  await expect(page.getByText("No results yet")).toBeHidden();
  await shot(page, mode, "results");

  await page.getByRole("link", { name: /^Report/ }).click();
  await expect(page.getByText(/Loading/)).toBeHidden();
  await shot(page, mode, "report");
  for (const format of ["Markdown", "PDF"]) {
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: new RegExp(format) })
      .first()
      .click();
    const file = await download;
    expect(file.suggestedFilename().toLowerCase()).toContain(format === "PDF" ? "pdf" : "md");
  }

  await page.getByRole("link", { name: "Project settings" }).click();
  await page.getByLabel("Name").fill("پروژه نمونه");
  await page.getByRole("button", { name: "Save name" }).click();
  await page.getByRole("link", { name: /^Report/ }).click();
  const title = mode === "real" ? /پروژه نمونه/ : /Example report/;
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const persian = page.waitForEvent("download");
  await page.getByRole("button", { name: /PDF/ }).first().click();
  expect((await persian).suggestedFilename().toLowerCase()).toContain("pdf");
  await shot(page, mode, "report-persian");

  await page
    .getByRole("button", { name: /^A$|account|user menu/i })
    .first()
    .click();
  await shot(page, mode, "user-menu");
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeAttached();
});

test("a new empty project starts its problem", async ({ page }, info) => {
  const mode = info.project.name;
  const login = mode === "real" ? real : mock;
  await page.goto("/projects");
  await signIn(page, login.email, login.password);
  await createEmpty(page, "پروژه خالی");
  await page.getByRole("link", { name: "1 Case" }).click();
  await page.getByRole("button", { name: "Start the case" }).click();
  await expect(page.getByText("Case v1")).toBeVisible();
});
