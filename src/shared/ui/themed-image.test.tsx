import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { fromSvgUrl, ThemedImage, toThemedSvg } from "./themed-image";

describe("themed figures", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--surface");
  });

  it("swaps the light colours for the tokens of the page", () => {
    document.documentElement.style.setProperty("--surface", "#101820");
    expect(toThemedSvg("<rect fill='#ffffff'/>")).toBe("<rect fill='#101820'/>");
  });

  it("reads an SVG link and refuses any other", () => {
    expect(fromSvgUrl("data:image/svg+xml;base64,PHN2Zy8+")).toBe("<svg/>");
    expect(fromSvgUrl("data:text/html;base64,AAAA")).toBeNull();
  });

  it("enlarges a wide figure on a click", async () => {
    render(<ThemedImage svg="<svg/>" alt="Plant" zoom />);
    await userEvent.click(screen.getByRole("button", { name: "Enlarge: Plant" }));
    expect(screen.getByRole("button", { name: "Close the figure" })).toBeVisible();
  });
});
