import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CapacityTiles } from "./capacity-tiles";
import { KpiTiles } from "./kpi-tiles";

const items = [
  { name: "lcts_eur", title: "lcts_eur", value: 47.81333, unit: "EUR/MWh", reason: null },
  { name: "heat_delivered", title: "heat_delivered", value: 51264.867, unit: "MWh", reason: null },
  {
    name: "heating_supply/hp",
    title: "heating_supply/hp (heat_pump)",
    value: 1500000,
    unit: "W/K",
    reason: null,
  },
  {
    name: "lcoc",
    title: "lcoc",
    value: null,
    unit: "EUR/MWh",
    reason: "no_value: no cooling unit",
  },
];

describe("KpiTiles", () => {
  it("shortens values, keeps the full value in a title and shows the title as given", () => {
    render(<KpiTiles items={items} label="Key figures" />);
    const lcts = screen.getByTitle("47.81333 EUR/MWh");
    expect(lcts).toHaveTextContent("47.8");
    expect(screen.getByTitle("51264.867 MWh")).toHaveTextContent("51.3");
    expect(screen.getByTitle("1500000 W/K")).toHaveTextContent("1,500,000");
    expect(screen.getByText("lcts_eur")).toBeVisible();
    expect(screen.getByText("heat_delivered")).toBeVisible();
  });

  it("shows a missing value as muted with gemini's reason, not as an error", () => {
    render(<KpiTiles items={items} label="Key figures" />);
    expect(screen.queryByText("missing")).not.toBeInTheDocument();
    expect(screen.getByText("no_value: no cooling unit")).toBeVisible();
  });
});

describe("CapacityTiles", () => {
  const item = {
    name: "d0",
    title: "d0",
    kind: "Production pump",
    value: 300,
    unit: "m3/h",
    peak: 150,
    peak_unit: "m3/h",
    share: 0.5,
    reason: null,
  };

  it("names the module and says the peak and the share used", () => {
    render(<CapacityTiles items={[item]} label="Capacities" />);
    expect(screen.getByText("Doublet 1")).toBeVisible();
    expect(screen.getByText("Production pump")).toBeVisible();
    expect(screen.getByText("peak 150 m3/h, 50% of the rating")).toBeVisible();
  });

  it("says a module the run did not use", () => {
    render(<CapacityTiles items={[{ ...item, peak: null, share: null }]} label="Sizes" />);
    expect(screen.getByText("not used in this run")).toBeVisible();
  });
});
