import { describe, expect, it } from "vitest";
import type { Project } from "@/shared/api/types";
import { toNextStep } from "./next-step";

const done = { state: "done", label: "done" } as const;
const empty = { state: "empty", label: "empty" } as const;
const all: Project["progress"] = {
  case: done,
  plant: done,
  study: done,
  results: done,
  report: done,
};

describe("toNextStep", () => {
  it("starts at the first unfinished step", () => {
    expect(toNextStep({ ...all, case: empty, plant: empty }, new Set())).toBe("case");
    expect(toNextStep({ ...all, plant: empty }, new Set())).toBe("plant");
  });

  it("sends old results back to the study", () => {
    expect(toNextStep(all, new Set(["study", "results"]))).toBe("study");
  });

  it("has no next step when everything is done", () => {
    expect(toNextStep(all, new Set())).toBeNull();
  });
});
