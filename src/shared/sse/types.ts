import type { NextStep } from "./next-steps";
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

/** Why a tool failed, when it returned a code: no_case, case_incomplete, and others. */
export type ToolProblem = {
  code: string;
  path: string | null;
  message: string;
  suggestions: string[];
};

export type StateOperation = "add" | "replace" | "remove";

export type StateChange = { op: StateOperation; path: string; value?: unknown };

/** Where an event comes from; `instance` names one of several parallel runs of one agent ("Geoscientist II", IMP-025), else null. */
type Origin = {
  sequence: number | null;
  agent: string;
  parent: string | null;
  instance?: string | null;
};

export type RunEventBody =
  | { type: "run.started"; run: string; loop: string | null }
  | { type: "step.started"; index: number; model: string; ts?: string; context_window?: number }
  | { type: "text.delta"; index: number; text: string; buffered?: true }
  | {
      type: "tool.started";
      index: number;
      call_id: string;
      tool: string;
      input: unknown;
      mcp?: string;
    }
  | {
      type: "tool.finished";
      index: number;
      call_id: string;
      output_summary: string;
      duration: number;
      error?: string;
      problem?: ToolProblem;
    }
  | { type: "step.finished"; index: number; usage: Usage; text: string; ts?: string }
  | { type: "state.changed"; version: number; changes: StateChange[] }
  | ({ type: "request" } & RunRequest)
  | ({ type: "usage" } & Usage)
  | { type: "study.recorded"; call_id: string; study: string; method: string }
  | { type: "retry"; attempt: number; model: string; delay: number; status: number | null }
  | {
      type: "answer";
      request: string;
      decision: string;
      reason: string | null;
      text: string | null;
      tool: string | null;
      by: string;
    }
  | {
      type: "question.auto_answered";
      index: number;
      request_id: string | null;
      call_id: string | null;
      tool: string | null;
      point: string;
      answer: string;
    }
  | {
      type: "run.finished";
      status: RunStatus;
      stop_reason: string;
      message?: string;
      suggestions?: NextStep[];
    };

export type RunEvent = Origin & RunEventBody;
