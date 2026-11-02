import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DaysStrip, type Day } from "./days-strip";
import { LineChart } from "./line-chart";
import { ProgressBar } from "./progress-bar";
import { Scatter } from "./scatter";

const days: Day[] = [
  { date: "2027-01-01", source: "geothermal" },
  { date: "2027-01-02", source: "geothermal" },
  { date: "2027-01-03", source: "backup" },
];

describe("DaysStrip", () => {
  it("draws one cell per day and counts the days by source in text", () => {
    render(<DaysStrip days={days} title="Days covered" />);
    expect(
      screen.getByRole("img", { name: /Geothermal 2 days, Backup 1 days, Short 0 days/ }),
    ).toBeVisible();
    expect(screen.getByText("Backup: 1 days")).toBeVisible();
    expect(document.querySelectorAll("rect")).toHaveLength(3);
  });
});

describe("Scatter", () => {
  it("names the designs on the best trade-off line in its text alternative", () => {
    const points = [
      { id: "a", label: "Design A", x: 38.9, y: 27.4 },
      { id: "b", label: "Design B", x: 41.8, y: 19.6 },
    ];
    render(
      <Scatter
        points={points}
        paretoIds={["b"]}
        xTitle="LCOH (EUR/MWh)"
        yTitle="CO2 (kt/yr)"
        title="Compare"
      />,
    );
    expect(screen.getByRole("img", { name: /2 designs, best trade-offs: Design B/ })).toBeVisible();
    expect(screen.getByText("LCOH (EUR/MWh)")).toBeVisible();
  });
});

describe("LineChart", () => {
  it("lists every series with its unit", () => {
    const points: [string, number][] = [
      ["2027-01-01", 3],
      ["2027-01-02", 5],
    ];
    const series = [{ name: "heat", unit: "MW", points }];
    render(<LineChart series={series} title="Demand" />);
    expect(screen.getByText("heat (MW)")).toBeVisible();
  });
});

describe("ProgressBar", () => {
  it("states the value when known", () => {
    render(<ProgressBar value={3} max={10} label="Study" />);
    expect(screen.getByRole("progressbar", { name: "Study" })).toHaveAttribute(
      "aria-valuenow",
      "3",
    );
  });

  it("claims no value when indeterminate", () => {
    render(<ProgressBar value={null} max={1} label="Study" />);
    expect(screen.getByRole("progressbar", { name: "Study" })).not.toHaveAttribute("aria-valuenow");
  });
});
