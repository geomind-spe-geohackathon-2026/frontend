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

  it("marks a field missing only when gemini reports its path", () => {
    render(
      <SchemaForm
        schema={siteSchema}
        initial={{}}
        onChange={vi.fn()}
        prefix="site"
        missing={["site.ground.gradient.value"]}
      />,
    );
    expect(screen.getByLabelText("Gradient")).toHaveValue(null);
    expect(screen.getByRole("combobox", { name: "Unit of Gradient" })).toHaveValue("");
    expect(screen.getAllByText("missing")).toHaveLength(1);
  });

  it("marks nothing missing when gemini reports nothing", () => {
    render(<SchemaForm schema={siteSchema} initial={{}} onChange={vi.fn()} prefix="site" />);
    expect(screen.queryByText("missing")).toBeNull();
  });

  it("does not choose a unit when a value is typed, and shows the unit as missing", async () => {
    const onChange = vi.fn();
    render(<SchemaForm schema={siteSchema} initial={{}} onChange={onChange} prefix="site" />);
    await userEvent.type(screen.getByLabelText("Gradient"), "30");
    expect(onChange).toHaveBeenLastCalledWith({ ground: { gradient: { value: 30 } } }, []);
    expect(screen.getByRole("combobox", { name: "Unit of Gradient" })).toHaveValue("");
    expect(screen.getByText("choose a unit")).toBeVisible();
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Unit of Gradient" }),
      "K/km",
    );
    expect(screen.queryByText("choose a unit")).toBeNull();
  });

  it("keeps a nested optional group collapsed until it has a value or gemini reports a gap in it", () => {
    const schema = {
      type: "object",
      required: [],
      properties: {
        outer: {
          type: "object",
          required: [],
          properties: {
            extra: {
              type: "object",
              required: ["kind"],
              properties: { kind: { enum: ["uniform", "normal"] } },
            },
          },
        },
      },
    };
    const { rerender } = render(<SchemaForm schema={schema} initial={{}} onChange={vi.fn()} />);
    expect(screen.getByText("Extra").closest("details")).not.toHaveAttribute("open");
    expect(screen.queryByText("missing")).toBeNull();
    rerender(
      <SchemaForm schema={schema} initial={{}} onChange={vi.fn()} missing={["outer.extra.kind"]} />,
    );
    expect(screen.getByText("Extra").closest("details")).toHaveAttribute("open");
  });

  it("shows the form of an empty anyOf without a chooser", () => {
    const onChange = vi.fn();
    render(
      <SchemaForm
        schema={exampleCaseSchema.properties?.economics ?? {}}
        initial={undefined}
        onChange={onChange}
        prefix="economics"
      />,
    );
    expect(screen.queryByRole("radiogroup", { name: "Form of the value" })).toBeNull();
    expect(screen.getByLabelText("Discount rate")).toBeVisible();
  });

  it("offers the choice for a value that names a file, and leads to the form", async () => {
    render(
      <SchemaForm
        schema={exampleCaseSchema.properties?.economics ?? {}}
        initial="economics.json"
        onChange={vi.fn()}
        prefix="economics"
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "Fill in here" }));
    expect(screen.getByLabelText("Discount rate")).toBeVisible();
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

  it("offers a list of choices as checkboxes and reports the chosen ones", async () => {
    const schema = {
      type: "object",
      properties: {
        metrics: { type: "array", minItems: 1, items: { type: "string", enum: ["lcts", "co2"] } },
      },
    };
    const onChange = vi.fn();
    render(<SchemaForm schema={schema} initial={{}} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "co2" }));
    expect(onChange).toHaveBeenLastCalledWith({ metrics: ["co2"] }, []);
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
