import { describe, expect, it } from "vitest";
import { toAgentName } from "./agent-names";

describe("toAgentName", () => {
  it("names the root run (empty id) the Coordinator, never an empty line (QA-146)", () => {
    expect(toAgentName("")).toBe("Coordinator");
  });
});
