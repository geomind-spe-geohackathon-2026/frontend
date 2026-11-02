import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableScroll } from "./table-scroll";

function setSize(element: HTMLElement, sizes: Record<string, number>) {
  for (const [name, value] of Object.entries(sizes)) {
    Object.defineProperty(element, name, { configurable: true, value, writable: true });
  }
}

describe("TableScroll", () => {
  it("has no fade and no tab stop when the table fits", () => {
    const { container } = render(
      <TableScroll label="Users">
        <table />
      </TableScroll>,
    );
    expect(container.querySelector("[data-table-fade]")).toBeNull();
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("marks the edges with more to see as the table scrolls", () => {
    const { container } = render(
      <TableScroll label="Users">
        <table />
      </TableScroll>,
    );
    const box = container.querySelector<HTMLElement>("[data-table-scroll]");
    if (box === null) throw new Error("no scroll box");
    setSize(box, { clientWidth: 300, scrollWidth: 500, scrollLeft: 0 });
    act(() => {
      box.dispatchEvent(new Event("scroll"));
    });
    expect(container.querySelector('[data-table-fade="right"]')).not.toBeNull();
    expect(container.querySelector('[data-table-fade="left"]')).toBeNull();
    expect(screen.getByRole("region", { name: "Users" })).toHaveAttribute("tabindex", "0");

    setSize(box, { scrollLeft: 200 });
    act(() => {
      box.dispatchEvent(new Event("scroll"));
    });
    expect(container.querySelector('[data-table-fade="right"]')).toBeNull();
    expect(container.querySelector('[data-table-fade="left"]')).not.toBeNull();
  });
});
