import { describe, expect, it } from "vitest";
import { toShortId } from "./shortid";

describe("toShortId", () => {
  it("keeps the first eight hex characters of an id with or without dashes", () => {
    expect(toShortId("453b951b-6c25-45f1-be20-44cf0a20e03e")).toBe("453b951b");
    expect(toShortId("453b951b6c2545f1be2044cf0a20e03e")).toBe("453b951b");
  });
});
