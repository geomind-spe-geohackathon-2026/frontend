import { describe, expect, it } from "vitest";
import { toMessageWithFiles } from "./upload";

describe("toMessageWithFiles", () => {
  it("leaves a message without files as it is", () => {
    expect(toMessageWithFiles("Design it", [])).toBe("Design it");
  });

  it("names the attached files", () => {
    expect(toMessageWithFiles("Design it", ["brief.pdf", "demand.csv"])).toBe(
      "Design it\n\nAttached files: brief.pdf, demand.csv",
    );
  });
});
