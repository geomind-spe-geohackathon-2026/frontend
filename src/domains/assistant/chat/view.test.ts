import { describe, expect, it } from "vitest";
import { toEvents, toRecording } from "@/mocks/assistant-script";
import type { RunEvent } from "@/shared/sse/types";
import { applyChanges } from "./patch";
import { applyEvent, emptyView, loadProblem, type View } from "./view";

function fold(events: RunEvent[], from: View = emptyView): View {
  return events.reduce(applyEvent, from);
}

const recorded = toEvents(toRecording(0, "run-1", "example question", "approved"), "run-1", 1);
const stored = recorded.filter((event) => event.type !== "text.delta");

describe("applyEvent", () => {
  it("shows the same view live and after a reload replayed from the stored events", () => {
    expect(fold(stored)).toEqual(fold(recorded));
  });

  it("shows the same view when the stream is read in two parts, as after a reconnect", () => {
    const cut = Math.floor(recorded.length / 2);
    const live = fold(recorded.slice(cut), fold(recorded.slice(0, cut)));
    expect(live).toEqual(fold(recorded));
  });

  it("replaces the streamed text of a step with the full text of step.finished", () => {
    const at = recorded.findIndex((event) => event.type === "step.finished");
    const event = recorded[at];
    if (event?.type !== "step.finished") throw new Error("the recording has no finished step");
    const view = fold(recorded.slice(0, at + 1));
    expect(view.blocks[0]).toMatchObject({ kind: "text", text: event.text, open: false });
  });

  it("waits on the approval request and continues after the next event", () => {
    const at = recorded.findIndex((event) => event.type === "request");
    const waiting = fold(recorded.slice(0, at + 1));
    expect(waiting.status).toBe("waiting");
    expect(waiting.request?.kind).toBe("approval");
    const done = fold(recorded);
    expect(done.status).toBe("done");
    expect(done.request).toBeNull();
    expect(done.blocks.filter((block) => block.kind === "request")).toEqual([
      expect.objectContaining({ resolved: true }),
    ]);
  });

  it("builds the agent tree from the dotted paths and marks the delegated agent done", () => {
    const view = fold(recorded);
    expect(view.agents.coordinator).toMatchObject({ parent: null, state: "running" });
    expect(view.agents["coordinator.designer"]).toMatchObject({
      parent: "coordinator",
      state: "done",
    });
  });

  it("applies problem state changes in order and keeps the latest usage", () => {
    const view = fold(recorded);
    expect(view.problem.version).toBe(2);
    expect(view.problem.document).toEqual({
      goal: "example question",
      results: [{ id: "R1", text: "Plant sized" }],
    });
    expect(view.usage.cost).toBe(0.021);
  });

  it("marks the problem state stale on a version gap and takes the full copy after", () => {
    const gap = recorded.filter((event) => event.type !== "state.changed" || event.version === 2);
    const stale = fold(gap);
    expect(stale.problemStale).toBe(true);
    const loaded = loadProblem(stale, { version: 2, document: { goal: "g" } });
    expect(loaded.problemStale).toBe(false);
    expect(loaded.problem.version).toBe(2);
  });

  it("ignores a state change that is not newer than the loaded state", () => {
    const loaded = loadProblem(emptyView, { version: 5, document: { goal: "g" } });
    const view = fold(recorded, loaded);
    expect(view.problem).toEqual({ version: 5, document: { goal: "g" } });
    expect(view.problemStale).toBe(false);
  });

  it("ends a cancelled run with a closing block", () => {
    const cancel: RunEvent = {
      type: "run.finished",
      agent: "coordinator",
      parent: null,
      sequence: 99,
      status: "cancelled",
      stop_reason: "cancelled",
    };
    const view = fold([...recorded.slice(0, 3), cancel]);
    expect(view.status).toBe("cancelled");
    expect(view.blocks.at(-1)).toMatchObject({ kind: "end", status: "cancelled" });
  });
});

describe("applyChanges", () => {
  it("appends to a list with -, replaces by id and removes by id", () => {
    const document = { requirements: [{ id: "R1", status: "open" }] };
    const added = applyChanges(document, [
      { op: "add", path: "/requirements/-", value: { id: "R2", status: "open" } },
    ]);
    const replaced = applyChanges(added, [
      { op: "replace", path: "/requirements/R1/status", value: "met" },
    ]);
    const removed = applyChanges(replaced, [{ op: "remove", path: "/requirements/R2" }]);
    expect(removed).toEqual({ requirements: [{ id: "R1", status: "met" }] });
  });

  it("returns null when a path does not exist", () => {
    expect(applyChanges({}, [{ op: "replace", path: "/a/b", value: 1 }])).toBeNull();
  });

  it("does not change its input", () => {
    const document = { goal: "a" };
    applyChanges(document, [{ op: "replace", path: "/goal", value: "b" }]);
    expect(document).toEqual({ goal: "a" });
  });
});
