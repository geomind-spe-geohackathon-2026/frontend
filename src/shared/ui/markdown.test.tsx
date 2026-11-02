import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

const text =
  "## Capacities\n\n| Module | Capacity |\n| --- | --- |\n| Pump | 3 MW |\n\n```\nPlant a   b\n```\n\n<b>raw</b>";

describe("Markdown", () => {
  it("renders headings and pipe tables as real tables", () => {
    render(<Markdown text={text} />);
    expect(screen.getByRole("heading", { name: "Capacities" })).toBeVisible();
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Capacity" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "3 MW" })).toBeVisible();
    expect(document.body.textContent).not.toContain("| ---");
  });

  it("puts a table in its own scroll box and keeps a fixed-width block as code", () => {
    render(<Markdown text={text} />);
    expect(screen.getByRole("table").parentElement).toHaveClass("overflow-x-auto");
    const block = document.querySelector("pre");
    expect(block).toHaveClass("overflow-x-auto");
    expect(block?.textContent).toContain("Plant a   b");
  });

  it("shows raw HTML as text", () => {
    render(<Markdown text={text} />);
    expect(document.querySelector("b")).toBeNull();
  });

  it("shows an SVG image but no other data link", () => {
    const svg = "data:image/svg+xml;base64,PHN2Zy8+";
    render(<Markdown text={`![Figure](${svg})\n\n![Other](data:text/html;base64,AAAA)`} />);
    expect(screen.getByRole("img", { name: "Figure" })).toHaveAttribute("src", svg);
    expect(screen.getByRole("img", { name: "Other" })).not.toHaveAttribute(
      "src",
      "data:text/html;base64,AAAA",
    );
  });
});
