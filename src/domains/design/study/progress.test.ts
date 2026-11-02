import { describe, expect, it } from "vitest";
import type { Study } from "@/shared/api/types";
import { toProgress } from "./progress";

function study(change: Partial<Study>): Study {
  return {
    id: "example-1",
    project: "example-project-1",
    kind: "size",
    name: "Example",
    settings: {},
    status: "running",
    progress: { done: 0, total: 1 },
    started_by: { kind: "user", name: "Example", run: null },
    case_version: 1,
    plant_version: 1,
    result: null,
    error: null,
    missing: [],
    created: "2026-01-01T00:00:00Z",
    ended: null,
    ...change,
  };
}

describe("toProgress", () => {
  it("claims no percentage while a study runs at 0 of 1", () => {
    expect(toProgress(study({}))).toEqual({
      kind: "indeterminate",
      text: "running, progress is shown when it ends",
    });
  });

  it("shows a queued study as waiting", () => {
    expect(toProgress(study({ status: "queued" })).kind).toBe("indeterminate");
  });

  it("shows a finished study as complete", () => {
    expect(toProgress(study({ status: "done", progress: { done: 1, total: 1 } }))).toMatchObject({
      kind: "determinate",
      done: 1,
      total: 1,
    });
  });

  it("uses real counts when a study reports them", () => {
    expect(toProgress(study({ progress: { done: 38, total: 120 } }))).toMatchObject({
      kind: "determinate",
      text: "38 of 120",
    });
  });

  it("draws no bar for blocked, failed or cancelled studies", () => {
    expect(toProgress(study({ status: "blocked" })).kind).toBe("none");
    expect(toProgress(study({ status: "failed" })).kind).toBe("none");
    expect(toProgress(study({ status: "cancelled" })).kind).toBe("none");
  });
});
