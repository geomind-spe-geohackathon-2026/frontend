import { describe, expect, it } from "vitest";
import { toSizeLabel } from "./format";

describe("toSizeLabel", () => {
  it("keeps bytes whole", () => {
    expect(toSizeLabel(512)).toBe("512 B");
  });

  it("uses kilobytes and megabytes", () => {
    expect(toSizeLabel(156 * 1024)).toBe("156 KB");
    expect(toSizeLabel(2.1 * 1024 * 1024)).toBe("2.1 MB");
  });
});
