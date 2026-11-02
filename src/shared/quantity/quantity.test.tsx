import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Missing } from "./missing";
import { Quantity } from "./quantity";

describe("Quantity", () => {
  it("shows the value and the unit", () => {
    render(<Quantity value={31.2} unit="MW" />);
    expect(screen.getByText(/31\.2/).textContent).toBe("31.2\u00a0MW");
  });

  it("groups thousands and limits digits", () => {
    render(<Quantity value={1234.56789} unit="m3/h" fractionDigits={1} />);
    expect(screen.getByText(/1,234\.6/)).toBeVisible();
  });

  it("shows zero as a number, not as missing", () => {
    render(<Quantity value={0} unit="K" />);
    expect(screen.getByText(/^0/).textContent).toBe("0\u00a0K");
  });

  it("omits the unit of a dimensionless value", () => {
    render(<Quantity value={3.4} unit="" />);
    expect(screen.getByText("3.4")).toBeVisible();
  });
});

describe("Missing", () => {
  it("says missing and what it blocks", () => {
    render(<Missing blocks="cost results" />);
    expect(screen.getByText("missing")).toBeVisible();
    expect(screen.getByText("blocks cost results")).toBeVisible();
  });

  it("keeps what a missing value blocks out of the text when compact", () => {
    render(<Missing compact blocks="LCOC" />);
    expect(screen.getByText("missing")).toBeVisible();
    expect(screen.queryByText(/blocks/)).not.toBeInTheDocument();
    expect(screen.getByTitle("blocks LCOC")).toBeVisible();
  });
});
