import type { LlmCall, LogMessage, LogStep, Run, RunLog, ToolCall } from "@/shared/sse/contract";
import type { RunEvent } from "@/shared/sse/types";

const stepSeconds = 1.2;

function toKey(agent: string, index: number): string {
  return `${agent}#${String(index)}`;
}

function toMessages(agent: string, request: string, previous: LogStep | undefined): LogMessage[] {
  const system: LogMessage = { role: "system", content: `You are the ${agent} agent (example prompt).` };
  const first: LogMessage = { role: "user", content: request };
  if (previous === undefined) return [system, first];
  const answer = previous.llm_calls[0]?.answer ?? "";
  const results = previous.tool_calls.map(
    (call): LogMessage => ({
      role: "tool",
      content: typeof call.output === "string" ? call.output : JSON.stringify(call.output),
      tool_call_id: call.call_id,
    }),
  );
  return [system, first, { role: "assistant", content: answer }, ...results];
}

function findStep(steps: Map<string, LogStep>, event: RunEvent & { index: number }): LogStep {
  const key = toKey(event.agent, event.index);
  const found = steps.get(key);
  if (found !== undefined) return found;
  const created: LogStep = {
    index: event.index,
    agent: event.agent,
    parent: event.parent,
    llm_calls: [],
    tool_calls: [],
  };
  steps.set(key, created);
  return created;
}

function addEvent(steps: Map<string, LogStep>, event: RunEvent, request: string): void {
  if (event.type === "step.started") {
    const step = findStep(steps, event);
    const previous = steps.get(toKey(event.agent, event.index - 1));
    const call: LlmCall = {
      model: event.model,
      messages: toMessages(event.agent, request, previous),
      answer: "",
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      duration: 0,
    };
    step.llm_calls.push(call);
  }
  if (event.type === "step.finished") {
    const call = findStep(steps, event).llm_calls[0];
    if (call === undefined) return;
    call.answer = event.text;
    call.input_tokens = event.usage.input_tokens;
    call.output_tokens = event.usage.output_tokens;
    call.cost = event.usage.cost;
    call.duration = stepSeconds;
  }
  if (event.type === "tool.started") {
    const call: ToolCall = {
      call_id: event.call_id,
      tool: event.tool,
      input: event.input,
      output: null,
      duration: 0,
    };
    findStep(steps, event).tool_calls.push(call);
  }
  if (event.type === "tool.finished") {
    const call = findStep(steps, event).tool_calls.find((item) => item.call_id === event.call_id);
    if (call === undefined) return;
    call.output = event.output_summary;
    call.duration = event.duration;
    if (event.error !== undefined) call.error = event.error;
  }
}

/** Builds the example run log (steps with LLM calls and tool calls) from the stored events of a run. */
export function toRunLog(run: Run, events: RunEvent[], request: string): RunLog {
  const steps = new Map<string, LogStep>();
  events.forEach((event) => {
    addEvent(steps, event, request);
  });
  return { run, steps: [...steps.values()] };
}
