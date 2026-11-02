import type { RunEvent } from "@/shared/sse/types";

const encoder = new TextEncoder();

/** Encodes a run event as one server-sent event frame: event name, JSON data, sequence id. */
export function toFrame(event: RunEvent): Uint8Array {
  const { type, sequence, ...data } = event;
  const lines = [`event: ${type}`, `data: ${JSON.stringify(data)}`];
  if (sequence !== null) lines.push(`id: ${String(sequence)}`);
  return encoder.encode(`${lines.join("\n")}\n\n`);
}

export type Feed = {
  events: RunEvent[];
  openDeltas: RunEvent[];
  listeners: Set<(event: RunEvent) => void>;
  finished: boolean;
};

/** Opens a stream that replays the stored events after `lastId`, then follows the live ones until the run ends. */
export function toStream(feed: Feed, lastId: number): ReadableStream<Uint8Array> {
  let listener: ((event: RunEvent) => void) | null = null;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const stored = feed.events.filter((event) => (event.sequence ?? 0) > lastId);
      stored.forEach((event) => {
        controller.enqueue(toFrame(event));
      });
      if (lastId === 0) {
        feed.openDeltas.forEach((event) => {
          controller.enqueue(toFrame(event));
        });
      }
      if (feed.finished) {
        controller.close();
        return;
      }
      listener = (event) => {
        controller.enqueue(toFrame(event));
        if (event.type === "run.finished" && event.parent === null) controller.close();
      };
      feed.listeners.add(listener);
    },
    cancel() {
      if (listener !== null) feed.listeners.delete(listener);
    },
  });
}
