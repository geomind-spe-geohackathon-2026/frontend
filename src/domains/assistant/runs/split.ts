import type { LogMessage } from "@/shared/sse/runlog";

/** Splits the messages of an LLM call: system prompt and history (collapsed) and the new messages after the last answer. */
export function toSplit(messages: LogMessage[]): { history: LogMessage[]; fresh: LogMessage[] } {
  const body = messages.filter((message) => message.role !== "system");
  const system = messages.filter((message) => message.role === "system");
  const cut = body.findLastIndex((message) => message.role === "assistant") + 1;
  return { history: [...system, ...body.slice(0, cut)], fresh: body.slice(cut) };
}

/** Formats a tool input or output for reading: text as it is, anything else as indented JSON. */
export function toPretty(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}
