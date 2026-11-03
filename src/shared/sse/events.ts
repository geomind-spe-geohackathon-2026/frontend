import { toNextSteps } from "./next-steps";
import { ApiError } from "@/shared/api/errors";
import type { RunStatus } from "@/shared/api/types";
import type {
  RunEvent,
  RunEventBody,
  RunRequest,
  StateChange,
  StateOperation,
  ToolProblem,
  Usage,
} from "./types";

type Fields = Record<string, unknown>;

const statuses: readonly string[] = ["queued", "running", "waiting", "done", "failed", "cancelled"];
const operations: readonly string[] = ["add", "replace", "remove"];

function isFields(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStatus(value: string): value is RunStatus {
  return statuses.includes(value);
}

function isOperation(value: string): value is StateOperation {
  return operations.includes(value);
}

function invalid(type: string, key: string): ApiError {
  return new ApiError({
    status: 0,
    code: "invalid_event",
    message: `The ${type} event has no valid "${key}"`,
  });
}

function requireString(fields: Fields, key: string, type: string): string {
  const value = fields[key];
  if (typeof value !== "string") throw invalid(type, key);
  return value;
}

function requireNumber(fields: Fields, key: string, type: string): number {
  const value = fields[key];
  if (typeof value !== "number") throw invalid(type, key);
  return value;
}

const hexRunId = /^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/;

/** Writes a run id of an event (32 hex characters) in the dashed form the API uses; other ids are kept. */
export function fromRunId(id: string): string {
  const match = hexRunId.exec(id.toLowerCase());
  return match === null ? id : match.slice(1).join("-");
}

function optionalString(fields: Fields, key: string): string | null {
  const value = fields[key];
  return typeof value === "string" ? value : null;
}

function toUsage(value: unknown, type: string): Usage {
  if (!isFields(value)) throw invalid(type, "usage");
  return {
    input_tokens: requireNumber(value, "input_tokens", type),
    output_tokens: requireNumber(value, "output_tokens", type),
    cost: requireNumber(value, "cost", type),
  };
}

function toChange(value: unknown): StateChange {
  const type = "state.changed";
  if (!isFields(value)) throw invalid(type, "changes");
  const op = requireString(value, "op", type);
  if (!isOperation(op)) throw invalid(type, "op");
  const path = requireString(value, "path", type);
  return "value" in value ? { op, path, value: value.value } : { op, path };
}

function toRequest(fields: Fields): RunRequest {
  const type = "request";
  const kind = requireString(fields, "kind", type);
  if (kind !== "approval" && kind !== "question") throw invalid(type, "kind");
  const request: RunRequest = {
    request: requireString(fields, "request", type),
    kind,
    message: requireString(fields, "message", type),
  };
  const callId = optionalString(fields, "call_id");
  if (callId !== null) request.call_id = callId;
  if (Array.isArray(fields.options)) {
    request.options = fields.options.map((option: unknown) => {
      if (!isFields(option)) throw invalid(type, "options");
      return {
        value: requireString(option, "value", type),
        label: requireString(option, "label", type),
      };
    });
  }
  return request;
}

function toToolFinished(fields: Fields): RunEventBody {
  const type = "tool.finished";
  const body: RunEventBody = {
    type,
    index: requireNumber(fields, "index", type),
    call_id: requireString(fields, "call_id", type),
    output_summary: requireString(fields, "output_summary", type),
    duration: requireNumber(fields, "duration", type),
  };
  const error = fields.error;
  const problem = toProblem(fields.problem);
  const withProblem = problem === null ? body : { ...body, problem };
  if (error === undefined || error === null) return withProblem;
  return { ...withProblem, error: typeof error === "string" ? error : JSON.stringify(error) };
}

function toProblem(value: unknown): ToolProblem | null {
  if (!isFields(value)) return null;
  const { code, path, message, suggestions } = value;
  if (typeof code !== "string" || typeof message !== "string") return null;
  return {
    code,
    path: typeof path === "string" ? path : null,
    message,
    suggestions: Array.isArray(suggestions)
      ? suggestions.filter((entry): entry is string => typeof entry === "string")
      : [],
  };
}

function toStepStarted(fields: Fields): RunEventBody {
  const type = "step.started";
  const body: RunEventBody = {
    type,
    index: requireNumber(fields, "index", type),
    model: requireString(fields, "model", type),
  };
  const size = fields.context_window;
  return typeof size === "number" && size > 0 ? { ...body, context_window: size } : body;
}

function toToolStarted(fields: Fields): RunEventBody {
  const type = "tool.started";
  const body: RunEventBody = {
    type,
    index: requireNumber(fields, "index", type),
    call_id: requireString(fields, "call_id", type),
    tool: requireString(fields, "tool", type),
    input: fields.input,
  };
  const server = fields.mcp ?? fields.connector;
  return typeof server === "string" ? { ...body, mcp: server } : body;
}

function toDelta(fields: Fields): RunEventBody {
  const type = "text.delta";
  const body = {
    type,
    index: requireNumber(fields, "index", type),
    text: requireString(fields, "text", type),
  } as const;
  return fields.buffered === true ? { ...body, buffered: true } : body;
}

function toStepBody(type: string, fields: Fields): RunEventBody | null {
  switch (type) {
    case "run.started":
      return {
        type,
        run: fromRunId(requireString(fields, "run", type)),
        loop: optionalString(fields, "loop"),
      };
    case "step.started":
      return toStepStarted(fields);
    case "text.delta":
      return toDelta(fields);
    case "tool.started":
      return toToolStarted(fields);
    case "tool.finished":
      return toToolFinished(fields);
    default:
      return null;
  }
}

function toStateBody(type: string, fields: Fields): RunEventBody | null {
  switch (type) {
    case "step.finished":
      return {
        type,
        index: requireNumber(fields, "index", type),
        usage: toUsage(fields.usage, type),
        text: requireString(fields, "text", type),
      };
    case "state.changed":
      if (!Array.isArray(fields.changes)) throw invalid(type, "changes");
      return {
        type,
        version: requireNumber(fields, "version", type),
        changes: fields.changes.map(toChange),
      };
    case "request":
      return { type, ...toRequest(fields) };
    case "usage":
      return { type, ...toUsage(fields, type) };
    case "study.recorded":
      return toStudyRecorded(fields);
    case "run.finished":
      return toFinished(fields);
    default:
      return null;
  }
}

function toStudyRecorded(fields: Fields): RunEventBody | null {
  const call = optionalString(fields, "call_id");
  const study = optionalString(fields, "study");
  const method = optionalString(fields, "method");
  if (call === null || study === null || method === null) return null;
  return { type: "study.recorded", call_id: call, study, method };
}

function toFinished(fields: Fields): RunEventBody {
  const type = "run.finished";
  const status = requireString(fields, "status", type);
  if (!isStatus(status)) throw invalid(type, "status");
  const body: RunEventBody = {
    type,
    status,
    stop_reason: requireString(fields, "stop_reason", type),
  };
  const message = optionalString(fields, "message");
  const withMessage = message === null ? body : { ...body, message };
  const steps = toNextSteps(fields.suggestions);
  return steps.length === 0 ? withMessage : { ...withMessage, suggestions: steps };
}

function toParent(fields: Fields): string | null {
  const parent = optionalString(fields, "parent");
  return parent === null ? null : fromRunId(parent);
}

/** Converts a parsed event (name, data, id) into a RunEvent; unknown names give null. */
export function fromPayload(type: string, data: unknown, id: string): RunEvent | null {
  if (!isFields(data)) throw invalid(type, "data");
  const fields = data;
  const body = toStepBody(type, fields) ?? toStateBody(type, fields);
  if (body === null) return null;
  const sequence = Number.parseInt(id, 10);
  return {
    ...body,
    sequence: Number.isNaN(sequence) ? null : sequence,
    agent: requireString(fields, "agent", type),
    parent: toParent(fields),
  };
}

/** Converts one server-sent event (name, JSON data, id) into a RunEvent; unknown names give null. */
export function fromEvent(type: string, data: string, id: string): RunEvent | null {
  if (data === "") return null;
  const payload: unknown = JSON.parse(data);
  return fromPayload(type, payload, id);
}
