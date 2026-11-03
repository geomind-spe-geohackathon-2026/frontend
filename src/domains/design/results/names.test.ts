import { describe, expect, it } from "vitest";
import { toCheckTitle, toModuleName } from "./names";

describe("names of a result", () => {
  it("numbers doublets from one and writes other modules in words", () => {
    expect(toModuleName("d0")).toBe("Doublet 1");
    expect(toModuleName("compression_chiller")).toBe("Compression chiller");
  });

  it("says what a demand check measures", () => {
    expect(toCheckTitle("Heat delivered")).toBe("Heat not delivered");
    expect(toCheckTitle("Doublet count")).toBe("Doublet count");
  });
});
