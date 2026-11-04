import { ApiError } from "@/shared/api/errors";
import type { Run } from "@/shared/api/types";

export type LogMessage = {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_calls?: unknown;
  tool_call_id?: string;
};

export type LlmCall = {
  model: string;
  messages: LogMessage[];
  answer: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  duration: number;
};

export type ToolCall = {
  call_id: string;
  tool: string;
  input: unknown;
  output: unknown;
  duration: number;
  error?: string | boolean;
};

export type LogStep = {
  index: number;
  agent: string;
  parent: string | null;
  llm_calls: LlmCall[];
  tool_calls: ToolCall[];
};

export type RunLog = { run: Run; steps: LogStep[] };

function isRunLog(value: unknown): value is RunLog {
  if (typeof value !== "object" || value === null) return false;
  return "run" in value && "steps" in value && Array.isArray(value.steps);
}

/** Converts the body of GET /assistant/runs/{run_id}/log, which the schema leaves open, into a RunLog. */
export function fromLog(body: unknown): RunLog {
  if (isRunLog(body)) return body;
  throw new ApiError({
    status: 200,
    code: "invalid_response",
    message: "The run log has no run and steps",
  });
}
