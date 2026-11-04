import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CsvTable, toCsvRows } from "./csv-table";
import { toTextKind } from "./viewer";

describe("CSV in the file viewer", () => {
  it("keeps quoted commas inside one cell", () => {
    expect(toCsvRows('item,source\nwell,"Smith, 2020"\n')).toEqual([
      ["item", "source"],
      ["well", "Smith, 2020"],
    ]);
  });

  it("draws a header and one row per line", () => {
    render(<CsvTable text={"item,value\ndrilling,1200\npump,80"} />);
    expect(screen.getByRole("columnheader", { name: "item" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("picks how each text file is shown", () => {
    expect(toTextKind("cost-sources.CSV")).toBe("table");
    expect(toTextKind("notes.md")).toBe("markdown");
    expect(toTextKind("case.json")).toBe("json");
    expect(toTextKind("readme.txt")).toBe("plain");
  });
});
