import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfigEditor } from "./config-editor";

const schema = {
  type: "object",
  properties: {
    ground: {
      type: "object",
      properties: { depth: { type: "number" }, name: { type: "string" } },
    },
  },
};

describe("ConfigEditor", () => {
  it("shows the config as JSON under the form and follows form edits", async () => {
    const onChange = vi.fn();
    render(
      <ConfigEditor
        schema={schema}
        initial={{ ground: { depth: 2000 } }}
        onChange={onChange}
        jsonLabel="JSON of the site"
      />,
    );
    const json = screen.getByRole("region", { name: "JSON of the site" });
    await waitFor(() => {
      expect(json).toHaveTextContent('"depth": 2000');
    });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Name/), "rock");
    await waitFor(() => {
      expect(json).toHaveTextContent('"name": "rock"');
    });
    expect(onChange).toHaveBeenLastCalledWith({ ground: { depth: 2000, name: "rock" } }, []);
  });

  it("draws a nested group as an indented branch under its title", () => {
    render(
      <ConfigEditor schema={schema} initial={{}} onChange={vi.fn()} jsonLabel="JSON of the site" />,
    );
    const ground = screen.getByText("Ground").closest("details, fieldset");
    expect(ground?.querySelector(".border-l")).not.toBeNull();
  });
});
