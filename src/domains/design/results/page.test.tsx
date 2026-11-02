import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/testing/render-app";

const base = "/projects/example-project-1/design/results";

describe("ResultsPage", () => {
  it("says coverage is not available when the result has none", async () => {
    renderApp({ path: `${base}/example-result-1` });
    expect(await screen.findByText(/Daily coverage by source is not available/)).toBeVisible();
    expect(screen.queryByRole("img", { name: /Days covered/ })).not.toBeInTheDocument();
  });

  it("draws the days strip and the constraint table when coverage exists", async () => {
    renderApp({ path: `${base}/example-result-2` });
    expect(
      await screen.findByRole("img", { name: /Geothermal 330 days, Backup 35 days/ }),
    ).toBeVisible();
    const table = screen.getByRole("table", { name: /Constraint checks/ });
    expect(within(table).getByText("not assessed")).toBeVisible();
    expect(screen.getByText("5 of 6 pass")).toBeVisible();
  });

  it("opens the first result by default and links to the report", async () => {
    renderApp({ path: base });
    const link = await screen.findByRole("link", { name: "Make report from this result" });
    expect(link).toHaveAttribute(
      "href",
      "/projects/example-project-1/design/report?result=example-result-1",
    );
  });

  it("compares results on two key figures", async () => {
    const user = userEvent.setup();
    renderApp({ path: base });
    await user.click(await screen.findByRole("tab", { name: "Compare" }));
    expect(await screen.findByRole("img", { name: /2 designs, best trade-offs/ })).toBeVisible();
    expect(screen.getAllByText("best trade-off")).toHaveLength(2);
  });
});
