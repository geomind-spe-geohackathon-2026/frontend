import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { isRecord } from "@/shared/forms/json-schema";
import { renderApp } from "@/testing/render-app";
import { server } from "@/testing/server";

const slow = { timeout: 4000 };

beforeAll(async () => {
  await import("./page");
}, 30000);
const withPlant = "/projects/example-project-1/design/plant";
const withoutPlant = "/projects/example-project-2/design/plant";

const quantity = (units: string[]) => ({
  type: "object",
  required: ["value", "unit"],
  properties: { value: { type: "number" }, unit: { enum: units } },
});

const geminiParameters = {
  module: "hx",
  type: "HeatExchanger",
  schema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "HeatExchanger",
    type: "object",
    properties: {
      dispatch: {
        anyOf: [{ type: "string", enum: ["least_cost"] }, { type: "null" }],
        default: null,
      },
      thermal_conductance: {
        anyOf: [{ type: "number", exclusiveMinimum: 0 }, quantity(["W/K"])],
        unit: "W/K",
      },
      pressure_drop: {
        anyOf: [{ type: "number", minimum: 0 }, quantity(["Pa", "bar"]), { type: "null" }],
        unit: "Pa",
        default: null,
      },
    },
    required: ["thermal_conductance"],
    additionalProperties: false,
  },
  values: { dispatch: null, thermal_conductance: 1500, pressure_drop: null },
  missing: [],
  history: [],
};

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

  it("asks the server to check the plant on the project's case", async () => {
    const projects: unknown[] = [];
    server.use(
      http.post("*/api/v1/plant/flowsheet/validate", async ({ request }) => {
        const body: unknown = await request.json();
        if (isRecord(body)) projects.push(body.project);
        return HttpResponse.json({ problems: [] });
      }),
    );
    renderApp({ path: withPlant });
    await findSave();
    await waitFor(() => {
      expect(projects).toContain("example-project-1");
    });
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
    expect(await screen.findByText("1 problem", {}, slow)).toBeVisible();
    expect(screen.getByRole("region", { name: "Problems to fix before saving" })).toHaveTextContent(
      "ports do not match",
    );
    expect(screen.getByRole("button", { name: "Save version" })).toBeDisabled();
  });

  it("shows the parameter form with units and a missing mark for the selected module", async () => {
    renderApp({ path: `${withPlant}?module=hx` });
    expect(await screen.findByLabelText(/Approach temperature/, {}, slow)).toBeVisible();
    expect(screen.getByLabelText(/Duty/)).toHaveValue(20);
    expect(screen.getAllByText("K").length).toBeGreaterThan(0);
    expect(screen.getByText("missing")).toBeVisible();
  });

  it("draws gemini's parameters as value, unit and range, never as a form chooser", async () => {
    const saved: unknown[] = [];
    server.use(
      http.get("*/api/v1/plant/parameters", () => HttpResponse.json(geminiParameters)),
      http.post("*/api/v1/plant/parameters", async ({ request }) => {
        saved.push(await request.json());
        return HttpResponse.json(
          { error: { code: "conflict", message: "newer", details: { latest: 4 } } },
          { status: 409 },
        );
      }),
    );
    renderApp({ path: `${withPlant}?module=hx` });
    const user = userEvent.setup();
    const conductance = await screen.findByLabelText("Thermal conductance", {}, slow);
    expect(conductance).toHaveValue(1500);
    expect(screen.getByText(/Range > 0 W\/K/)).toBeVisible();
    expect(screen.queryByLabelText(/^Form of/)).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Text" })).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Dispatch")).getByRole("option", { name: "least_cost" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Unit of Pressure drop")).getAllByRole("option"),
    ).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText("Dispatch"), "least_cost");
    const drop = screen.getByLabelText("Pressure drop");
    await user.clear(drop);
    await user.type(drop, "-1");
    expect(screen.getByText("Must be ≥ 0")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save parameters" })).toBeDisabled();
    await user.clear(drop);
    await user.type(drop, "2");
    await user.selectOptions(screen.getByLabelText("Unit of Pressure drop"), "bar");
    await user.click(screen.getByRole("button", { name: "Save parameters" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Save version" }),
    );
    await waitFor(() => {
      expect(saved).toHaveLength(1);
    });
    expect(saved[0]).toMatchObject({
      params: { dispatch: "least_cost", pressure_drop: { value: 2, unit: "bar" } },
    });
  });

  it("offers a module without parameters no form", async () => {
    server.use(
      http.get("*/api/v1/plant/parameters", () =>
        HttpResponse.json({
          ...geminiParameters,
          schema: { type: "object", properties: {} },
          values: {},
        }),
      ),
    );
    renderApp({ path: `${withPlant}?module=hx` });
    expect(await screen.findByText("This module has no parameters.", {}, slow)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Save parameters" })).not.toBeInTheDocument();
  });

  it("hides a stream kind from the legend", async () => {
    renderApp({ path: `${withPlant}?module=hx` });
    const user = userEvent.setup();
    const legend = await screen.findByRole("list", { name: "Stream kinds" }, slow);
    const stream = within(legend).getAllByRole("button")[0];
    if (stream === undefined) throw new Error("no stream in the legend");
    expect(stream).toHaveAttribute("aria-pressed", "true");
    await user.click(stream);
    expect(stream).toHaveAttribute("aria-pressed", "false");
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
    expect(await screen.findByText("Plant v1 saved", {}, slow)).toBeVisible();
  });

  it("opens the first module with missing values after a template and walks through them", async () => {
    renderApp({ path: withPlant });
    const user = userEvent.setup();
    await findSave();
    await user.click(screen.getByRole("button", { name: "Start from template" }));
    await user.click(await screen.findByRole("button", { name: "Use ExampleHeatingPlant" }, slow));
    expect(await screen.findByLabelText("Module id", {}, slow)).toHaveValue("hx");
    await user.click(await screen.findByRole("button", { name: "next" }, slow));
    expect(screen.getByLabelText("Module id")).toHaveValue("hx");
  });

  it("lists the missing values from the badge and says when the draft is unsaved", async () => {
    renderApp({ path: withPlant });
    const user = userEvent.setup();
    await findSave();
    await user.click(await screen.findByRole("button", { name: /values missing/ }, slow));
    await user.click(await screen.findByRole("menuitem", { name: "hx.approach_temperature" }));
    expect(await screen.findByLabelText("Module id")).toHaveValue("hx");
    expect(screen.queryByText("unsaved changes")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add HeatPump" }));
    expect(await screen.findByText("unsaved changes")).toBeVisible();
  });

  it("keeps whole plants in a closed group at the end of the palette", async () => {
    server.use(
      http.get("*/api/v1/plant/flowsheet/palette", () =>
        HttpResponse.json([
          { type: "Pump", title: "Pump", category: "pumps", summary: "" },
          { type: "BigPlant", title: "BigPlant", category: "plants", summary: "" },
        ]),
      ),
    );
    renderApp({ path: withPlant });
    await findSave();
    const group = screen.getByText("Sub-plants").closest("details");
    expect(group).not.toHaveAttribute("open");
    expect(group).toHaveAttribute("title", expect.stringContaining("nested plant"));
    expect(group).toContainElement(
      screen.getByRole("button", { name: "Add BigPlant", hidden: true }),
    );
  });

  it("shows template names in words with the class below and rst literals as code", async () => {
    server.use(
      http.get("*/api/v1/plant/flowsheet/templates", () =>
        HttpResponse.json([
          {
            name: "MultiWellPlant",
            title: "MultiWellPlant",
            description: "A field of ``producers`` limbs.",
            purpose: null,
            modules: 3,
            categories: ["plants"],
          },
        ]),
      ),
    );
    renderApp({ path: withoutPlant });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Start from template" }, slow));
    expect(await screen.findByText("Multi Well Plant")).toBeVisible();
    expect(screen.getByText("MultiWellPlant")).toBeVisible();
    expect(screen.getByText("producers").tagName).toBe("CODE");
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
