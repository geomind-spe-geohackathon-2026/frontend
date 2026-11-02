import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

const slow = { timeout: 4000 };

beforeAll(async () => {
  await import("./page");
}, 30000);
const withPlant = "/projects/example-project-1/design/plant";
const withoutPlant = "/projects/example-project-2/design/plant";

async function findSave() {
  return screen.findByRole("button", { name: "Save version" }, slow);
}

describe("Plant page", { timeout: 20000 }, () => {
  it("shows the modules by gemini class name, the palette and the missing values", async () => {
    renderApp({ path: withPlant });
    await findSave();
    expect((await screen.findAllByText("HeatExchanger", {}, slow)).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add Doublet" })).toBeVisible();
    expect(await screen.findByText("1 values missing", {}, slow)).toBeVisible();
    const missing = await screen.findByRole("region", { name: "Missing values" });
    expect(missing).toHaveTextContent("params.hx.approach_temperature");
    expect(screen.getByRole("button", { name: "Save version" })).toBeDisabled();
  });

  it("shows the handles of a new module at once, before any connection", async () => {
    renderApp({ path: withPlant });
    const user = userEvent.setup();
    await findSave();
    await user.click(screen.getByRole("button", { name: "Add HeatPump" }));
    expect(await screen.findByLabelText("Inlet source_in (brine)", {}, slow)).toBeInTheDocument();
    expect(screen.getByLabelText("Inlet power_in (electricity)")).toBeInTheDocument();
    expect(screen.getByLabelText("Outlet heat_out (hot_water)")).toBeInTheDocument();
  });

  it("keeps every module of a template plant when one is added, and selecting does not ask to leave", async () => {
    renderApp({ path: withPlant });
    const user = userEvent.setup();
    await findSave();
    expect((await screen.findAllByText("HeatExchanger", {}, slow)).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Add HeatPump" }));
    await screen.findByLabelText("Module id", {}, slow);
    expect(screen.getAllByText("HeatExchanger").length).toBeGreaterThan(0);
    expect(screen.getAllByText("HeatingGrid").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("hx"));
    expect(await screen.findByLabelText("Module id")).toHaveValue("hx");
    expect(screen.queryByRole("dialog", { name: "Unsaved changes" })).not.toBeInTheDocument();
  });

  it("has no form to type port names for a connection", async () => {
    renderApp({ path: `${withPlant}?module=hx` });
    await screen.findByLabelText("Module id", {}, slow);
    expect(screen.queryByLabelText("From outlet of this module")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add connection" })).not.toBeInTheDocument();
  });

  it("adds a module with a generated id, saves a new version and reports it", async () => {
    renderApp({ path: withPlant });
    const user = userEvent.setup();
    await findSave();
    await user.click(screen.getByRole("button", { name: "Add HeatPump" }));
    expect(await screen.findByLabelText("Module id")).toHaveValue("heat_pump");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save version" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Save version" }));
    await user.type(await screen.findByLabelText("Note"), "heat pump");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Save version" }),
    );
    expect(await screen.findByText("Plant v2 saved")).toBeVisible();
  });

  it("disables saving while the plant has a problem and lists it", async () => {
    server.use(
      http.post("*/api/v1/plant/flowsheet/validate", () =>
        HttpResponse.json({
          problems: [
            { path: "connections.0", message: "ports do not match", code: "invalid_connection" },
          ],
        }),
      ),
    );
    renderApp({ path: withPlant });
    const user = userEvent.setup();
    await findSave();
    await user.click(screen.getByRole("button", { name: "Add HeatPump" }));
    expect(await screen.findByText("1 problems", {}, slow)).toBeVisible();
    expect(screen.getByRole("region", { name: "Problems to fix before saving" })).toHaveTextContent(
      "ports do not match",
    );
    expect(screen.getByRole("button", { name: "Save version" })).toBeDisabled();
  });

  it("shows the parameter form with units and a missing mark for the selected module", async () => {
    renderApp({ path: `${withPlant}?module=hx` });
    expect(await screen.findByLabelText(/Approach temperature/, {}, slow)).toBeVisible();
    expect(screen.getByLabelText(/Duty/)).toHaveValue(20);
    expect(screen.getAllByText("[K]").length).toBeGreaterThan(0);
    expect(screen.getByText("missing")).toBeVisible();
  });

  it("offers a reload when a newer version exists", async () => {
    server.use(
      http.post("*/api/v1/plant/flowsheet", () =>
        HttpResponse.json(
          { error: { code: "conflict", message: "newer", details: { latest: 4 } } },
          { status: 409 },
        ),
      ),
    );
    renderApp({ path: withPlant });
    const user = userEvent.setup();
    await findSave();
    await user.click(screen.getByRole("button", { name: "Add HeatPump" }));
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
      expect(screen.getByRole("button", { name: "Discard changes" })).toBeDisabled();
    });
  });

  it("restores an older version into the editor", async () => {
    renderApp({ path: withPlant });
    const user = userEvent.setup();
    await findSave();
    await user.click(screen.getByRole("button", { name: "Add HeatPump" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save version" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Save version" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Save version" }),
    );
    await screen.findByText("Plant v2 saved");
    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(await screen.findByRole("button", { name: "Restore version 1" }));
    expect(await screen.findByText(/Version 1 loaded into the editor/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeEnabled();
  });

  it("offers templates when the project has no plant", async () => {
    renderApp({ path: withoutPlant });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Start from template" }, slow));
    await user.click(await screen.findByRole("button", { name: "Use ExampleHeatingPlant" }));
    expect(await screen.findByText("Plant v1 saved")).toBeVisible();
  });

  it("shows the error state with a retry", async () => {
    server.use(
      http.get("*/api/v1/plant/flowsheet", () =>
        HttpResponse.json(
          { error: { code: "internal", message: "boom", details: {} } },
          { status: 500 },
        ),
      ),
    );
    renderApp({ path: withPlant });
    expect(await screen.findByRole("alert", {}, slow)).toHaveTextContent("internal: boom");
  });
});
