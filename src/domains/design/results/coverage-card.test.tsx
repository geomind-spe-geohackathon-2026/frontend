import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Coverage } from "@/shared/api/types";
import { CoverageCard } from "./coverage-card";

function day(service: Coverage["service"], date: string, source: Coverage["source"]): Coverage {
  const energy = { value: 1, unit: "MWh" };
  return {
    date,
    source,
    service,
    demand: energy,
    geothermal: energy,
    backup: energy,
    short: energy,
    failed_steps: 0,
  };
}

describe("CoverageCard", () => {
  it("draws one strip for each service that has days", () => {
    render(
      <CoverageCard
        coverage={[
          day("heating", "2027-01-01", "backup"),
          day("heating", "2027-01-02", "geothermal"),
          day("cooling", "2027-01-01", "short"),
        ]}
      />,
    );
    expect(
      screen.getByRole("img", { name: /Heating.*Geothermal 1 days, Backup 1 days/ }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: /Cooling.*Short 1 days/ })).toBeVisible();
  });

  it("says coverage is not available when there is none", () => {
    render(<CoverageCard coverage={null} />);
    expect(screen.getByText(/not available/)).toBeVisible();
  });
});
