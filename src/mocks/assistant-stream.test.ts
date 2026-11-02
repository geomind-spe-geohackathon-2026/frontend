import { describe, expect, it } from "vitest";
import { toStream, type Feed } from "./assistant-stream";
import type { RunEvent } from "@/shared/sse/types";

const origin = { agent: "coordinator", parent: null };

function delta(index: number, text: string): RunEvent {
  return { ...origin, type: "text.delta", sequence: null, index, text };
}

async function toText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) return text;
    text += decoder.decode(chunk.value);
  }
}

describe("toStream", () => {
  it("sends one buffered text.delta without an id for the open step, also on a reconnect", async () => {
    const feed: Feed = {
      events: [{ ...origin, type: "step.started", sequence: 4, index: 0, model: "m" }],
      openDeltas: [delta(0, "Hello "), delta(0, "brave ")],
      listeners: new Set(),
      finished: true,
    };
    const text = await toText(toStream(feed, 3));
    expect(text).toContain("event: step.started");
    const frames = text.split("\n\n").filter((frame) => frame.startsWith("event: text.delta"));
    expect(frames).toHaveLength(1);
    expect(frames[0]).not.toContain("id:");
    expect(JSON.parse(frames[0]?.split("data: ")[1] ?? "{}")).toMatchObject({
      index: 0,
      text: "Hello brave ",
      buffered: true,
    });
  });

  it("sends no text.delta when no step is open", async () => {
    const feed: Feed = { events: [], openDeltas: [], listeners: new Set(), finished: true };
    expect(await toText(toStream(feed, 0))).not.toContain("text.delta");
  });
});
