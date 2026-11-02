import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { exampleCaseSchema } from "./example-schema";
import { SchemaForm } from "./schema-form";

const siteSchema = exampleCaseSchema.properties?.site ?? {};

describe("SchemaForm", () => {
  it("renders no form element, so it can sit inside a form", () => {
    const { container } = render(
      <form>
        <SchemaForm schema={siteSchema} initial={{}} onChange={vi.fn()} prefix="site" />
      </form>,
    );
    expect(container.querySelectorAll("form form")).toHaveLength(0);
    expect(container.querySelectorAll("form")).toHaveLength(1);
  });

  it("shows a label, a unit and a missing mark for an empty required quantity", () => {
    render(<SchemaForm schema={siteSchema} initial={{}} onChange={vi.fn()} prefix="site" />);
    expect(screen.getByLabelText("Gradient")).toHaveValue(null);
    expect(screen.getByRole("combobox", { name: "Unit of Gradient" })).toHaveValue("");
    expect(screen.getByText("missing")).toBeVisible();
  });

  it("reports the typed value with the first unit and drops the missing mark", async () => {
    const onChange = vi.fn();
    render(<SchemaForm schema={siteSchema} initial={{}} onChange={onChange} prefix="site" />);
    await userEvent.type(screen.getByLabelText("Gradient"), "30");
    expect(onChange).toHaveBeenLastCalledWith(
      { ground: { gradient: { value: 30, unit: "K/km" } } },
      [],
    );
    expect(screen.queryByText("missing")).toBeNull();
  });

  it("shows a server problem next to its field", () => {
    render(
      <SchemaForm
        schema={siteSchema}
        initial={{ ground: { gradient: { value: 3, unit: "K/km" } } }}
        onChange={vi.fn()}
        prefix="site"
        problems={[{ path: "site.ground.gradient.unit", message: "unit is not a gradient" }]}
      />,
    );
    expect(screen.getByText("unit is not a gradient")).toBeVisible();
  });

  it("adds and removes list items", async () => {
    const schema = exampleCaseSchema.properties?.requirements ?? {};
    const onChange = vi.fn();
    render(<SchemaForm schema={schema} initial={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(screen.getByLabelText("Name")).toBeVisible();
    await userEvent.type(screen.getByLabelText("Name"), "limit");
    expect(onChange).toHaveBeenLastCalledWith([{ name: "limit" }], []);
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(screen.queryByLabelText("Name")).toBeNull();
  });
});
