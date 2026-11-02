import type { RunRequest, RunStatus, Usage } from "./types";

export type Run = {
  id: string;
  chat: string;
  project: string;
  status: RunStatus;
  loop: string;
  started: string;
  ended: string | null;
  usage: Usage;
  request: RunRequest | null;
  error: { code: string; message: string } | null;
};

export type Chat = {
  id: string;
  project: string;
  title: string;
  created: string;
  last_run: { id: string; status: RunStatus } | null;
};

export type Message = {
  id: string;
  chat: string;
  role: "user" | "assistant";
  content: string;
  created: string;
  run?: string;
};

export type ChatState = { version: number; state: unknown };

export type SentMessage = { message: Message; run: Run };

export type UsageTotals = { runs: number; input_tokens: number; output_tokens: number; cost: number };

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
  error?: string;
};

export type LogStep = {
  index: number;
  agent: string;
  parent: string | null;
  llm_calls: LlmCall[];
  tool_calls: ToolCall[];
};

export type RunLog = { run: Run; steps: LogStep[] };

export type Answer = { approved: boolean; reason?: string } | { text: string };
