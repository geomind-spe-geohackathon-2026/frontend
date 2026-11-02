import { describe, expect, it } from "vitest";
import { toInitials } from "./initials";

describe("toInitials", () => {
  it("takes the first letters of two words", () => {
    expect(toInitials("Sahand Nazarzadeh")).toBe("SN");
  });

  it("takes two letters of a single word", () => {
    expect(toInitials("sahand")).toBe("SA");
  });
});
