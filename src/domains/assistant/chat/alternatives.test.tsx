import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { toAlternatives } from "./alternatives";
import { AlternativesTable } from "./alternatives-table";

const document = {
  design: {
    alternatives: [
      { family: "heat_pump", design: "d-hp", result: "r1", verdict: "verified", reason: null },
      {
        family: "absorption",
        design: "d-ab",
        result: null,
        verdict: "rejected",
        reason: "Too costly",
      },
      { family: "direct", design: null, result: null, verdict: "blocked", reason: "No price" },
    ],
    comparison: { by: "lcoh", ranking: ["d-hp", "absorption"], recommended: "heat_pump" },
  },
};

describe("alternatives", () => {
  it("reads the alternatives in ranking order and marks the recommended one", () => {
    const read = toAlternatives(document);
    expect(read?.by).toBe("lcoh");
    expect(read?.items.map((item) => [item.family, item.rank, item.isRecommended])).toEqual([
      ["heat_pump", 1, true],
      ["absorption", 2, false],
      ["direct", null, false],
    ]);
  });

  it("is null without alternatives", () => {
    expect(toAlternatives({ design: {} })).toBeNull();
    expect(toAlternatives(null)).toBeNull();
  });

  it("shows a table with verdicts and the recommended design", () => {
    render(
      <MemoryRouter>
        <AlternativesTable document={document} projectId="p1" />
      </MemoryRouter>,
    );
    const table = screen.getByRole("region", { name: "Alternatives" });
    expect(table).toHaveTextContent("Ranked by Lcoh");
    const rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Heat pumpRecommendedverified");
    expect(rows[2]).toHaveTextContent("Too costly");
    expect(within(table).getAllByRole("link", { name: "Result" })).toHaveLength(1);
  });
});
