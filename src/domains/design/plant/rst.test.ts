import { describe, expect, it } from "vitest";
import { toInlineParts } from "./rst";

describe("toInlineParts", () => {
  it("turns literals into code parts", () => {
    expect(toInlineParts("A well field of ``producers`` and ``injectors`` limbs.")).toEqual([
      { text: "A well field of ", isCode: false },
      { text: "producers", isCode: true },
      { text: " and ", isCode: false },
      { text: "injectors", isCode: true },
      { text: " limbs.", isCode: false },
    ]);
  });

  it("strips roles, links and emphasis", () => {
    expect(
      toInlineParts("See :class:`~a.Pump`, `the docs <http://x>`_, **bold**, *soft* and `ref`_."),
    ).toEqual([{ text: "See a.Pump, the docs, bold, soft and ref.", isCode: false }]);
  });

  it("leaves plain text alone", () => {
    expect(toInlineParts("Plain.")).toEqual([{ text: "Plain.", isCode: false }]);
  });
});
