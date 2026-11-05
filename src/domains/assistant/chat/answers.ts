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

/** Writes the user's decision on a request as one line, or null when this tab did not see it. */
export function toDecisionText(request: string, message: string): string | null {
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
