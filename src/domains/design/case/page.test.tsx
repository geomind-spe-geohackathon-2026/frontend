import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";
import realSchema from "@/mocks/real-case-schema.json";
import { server } from "@/testing/server";

const slow = { timeout: 4000 };

beforeAll(async () => {
  await import("./page");
}, 30000);
const withCase = "/projects/example-project-1/design/case";
const withoutCase = "/projects/example-project-2/design/case";

describe("Problem page", { timeout: 20000 }, () => {
  it("builds its tabs from the schema and lists the missing values in a banner", async () => {
    renderApp({ path: withCase });
    const tabs = await screen.findByRole("tablist", { name: "Sections of the problem" }, slow);
    const names = within(tabs)
      .getAllByRole("tab")
      .map((tab) => tab.textContent);
    expect(names).toEqual(["Demand", "Site", "Economics", "Requirements", "Files", "History"]);
    const banner = screen.getByRole("region", { name: "Missing values" });
    expect(banner).toHaveTextContent("2 values missing");
    expect(banner).toHaveTextContent("economics.gas_price");
  });

  it("marks the missing field, clears the mark when filled and saves a new version", async () => {
    renderApp({ path: withCase });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: "Economics" }, slow));
    expect(screen.getAllByText("missing").length).toBeGreaterThan(0);
    const save = screen.getByRole("button", { name: "Save version" });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText("Gas price"), "30");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save version" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Save version" }));
    await user.type(await screen.findByLabelText("Note"), "gas price");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Save version" }),
    );
    expect(await screen.findByText("Problem v2 saved")).toBeVisible();
    expect(screen.getByText("Problem v2")).toBeVisible();
  });

  it("offers a reload when somebody saved a newer version", async () => {
    server.use(
      http.post("*/api/v1/design/case", () =>
        HttpResponse.json(
          { error: { code: "conflict", message: "newer", details: { latest: 5 } } },
          { status: 409 },
        ),
      ),
    );
    renderApp({ path: withCase });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: "Economics" }, slow));
    await user.type(screen.getByLabelText("Gas price"), "30");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save version" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Save version" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Save version" }),
    );
    expect(await screen.findByRole("dialog", { name: "A newer version exists" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Reload latest" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save version" })).toBeDisabled();
    });
  });

  it("offers to start an empty problem when the project has none", async () => {
    renderApp({ path: withoutCase });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Start the problem" }));
    expect(await screen.findByText("Problem v1")).toBeVisible();
  });

  it("shows the error state with a retry when the problem cannot be loaded", async () => {
    server.use(
      http.get("*/api/v1/design/case", () =>
        HttpResponse.json(
          { error: { code: "internal", message: "boom", details: {} } },
          { status: 500 },
        ),
      ),
    );
    renderApp({ path: withCase });
    expect(await screen.findByRole("alert")).toHaveTextContent("internal: boom");
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("shows the permission state on 403", async () => {
    server.use(
      http.get("*/api/v1/design/case", () =>
        HttpResponse.json(
          { error: { code: "forbidden", message: "no", details: {} } },
          { status: 403 },
        ),
      ),
    );
    renderApp({ path: withCase });
    expect(await screen.findByRole("alert")).toHaveTextContent("You do not have access");
  });
});

describe("Starting the problem", { timeout: 20000 }, () => {
  it("sends the header gemini's real schema describes, with the kind", async () => {
    let sent: unknown = null;
    server.use(
      http.get("*/api/v1/design/case/schema", () => HttpResponse.json(realSchema)),
      http.post("*/api/v1/design/case", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(
          { error: { code: "internal", message: "stop", details: {} } },
          { status: 500 },
        );
      }),
    );
    renderApp({ path: withoutCase });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Start the problem" }));
    await screen.findByRole("alert");
    expect(sent).toMatchObject({ content: { format: 1, kind: "case" } });
  });

  it("shows why the start failed, with the problems gemini names", async () => {
    server.use(
      http.post("*/api/v1/design/case", () =>
        HttpResponse.json(
          {
            error: {
              code: "case_invalid",
              message: "The case is invalid",
              details: { problems: [{ path: "kind", message: "old_format" }] },
            },
          },
          { status: 422 },
        ),
      ),
    );
    renderApp({ path: withoutCase });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Start the problem" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("case_invalid");
    expect(alert).toHaveTextContent("The case is invalid");
    expect(screen.getByRole("region", { name: "Problems" })).toHaveTextContent("old_format");
  });
});
