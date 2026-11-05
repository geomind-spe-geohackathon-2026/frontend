import type { Answer } from "@/shared/api/types";
import { toToolName } from "@/shared/sse/pretty";

const storageKey = "geomind.answers";

function readAll(): Record<string, Answer> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
    return typeof value === "object" && value !== null ? (value as Record<string, Answer>) : {};
  } catch {
    return {};
  }
}

/** Remembers in this tab what the user answered to a request, so the chat can say it afterwards. */
export function keepAnswer(request: string, answer: Answer): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ ...readAll(), [request]: answer }));
  } catch {
    return;
  }
}

function toName(tool: string | null, message: string): string {
  const found = tool ?? /^Allow (\S+)/.exec(message)?.[1] ?? null;
  return found === null ? "the tool call" : `"${toToolName(found)}"`;
}

/** Writes the decision on a request as one line: from the run's answer event, else from what this tab sent, else null. */
export function toDecisionText(
  request: string,
  message: string,
  note: { decision: string; reason: string | null; text: string | null; tool: string | null; by: string } | undefined = undefined,
): string | null {
  if (note !== undefined) {
    const who = note.by === "user" ? "You" : "Auto-approve";
    if (note.decision === "answer") return `${who} answered: ${note.text ?? ""}`;
    const verb = note.decision === "allow" ? "approved" : "denied";
    const reason = note.reason?.trim() ?? "";
    return `${who} ${verb} ${toName(note.tool, message)}${reason === "" ? "" : `: ${reason}`}`;
  }
  const answer = readAll()[request];
  if (answer === undefined) return null;
  if ("approved" in answer) {
    const found = /^Allow (\S+)/.exec(message);
    const name = found === null ? "the tool call" : `"${toToolName(found[1] ?? "")}"`;
    const reason = answer.reason?.trim() ?? "";
    const verb = answer.approved ? "approved" : "denied";
    return `You ${verb} ${name}${reason === "" ? "" : `: ${reason}`}`;
  }
  return `You answered: ${answer.text}`;
}
