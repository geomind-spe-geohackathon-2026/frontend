import type { RunStatus, Tokens } from "@/shared/api/types";

export type Usage = Tokens;

export type RequestOption = { value: string; label: string };

export type RunRequest = {
  request: string;
  call_id?: string;
  kind: "approval" | "question";
  message: string;
  options?: RequestOption[];
};

export type StateOperation = "add" | "replace" | "remove";

export type StateChange = { op: StateOperation; path: string; value?: unknown };

type Origin = { sequence: number | null; agent: string; parent: string | null };

export type RunEventBody =
  | { type: "run.started"; run: string; loop: string }
  | { type: "step.started"; index: number; model: string }
  | { type: "text.delta"; index: number; text: string; buffered?: true }
  | { type: "tool.started"; index: number; call_id: string; tool: string; input: unknown }
  | {
      type: "tool.finished";
      index: number;
      call_id: string;
      output_summary: string;
      duration: number;
      error?: string;
    }
  | { type: "step.finished"; index: number; usage: Usage; text: string }
  | { type: "state.changed"; version: number; changes: StateChange[] }
  | ({ type: "request" } & RunRequest)
  | ({ type: "usage" } & Usage)
  | { type: "run.finished"; status: RunStatus; stop_reason: string; message?: string };

export type RunEvent = Origin & RunEventBody;
