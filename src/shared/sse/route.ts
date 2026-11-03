export type Route =
  { kind: "answer"; answer: string } | { kind: "loop"; loop: string; agent: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads the coordinator's route from a text block, or null when the text is not a route. */
export function fromRoute(text: string): Route | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  if (value.kind === "answer" && typeof value.answer === "string") {
    return { kind: "answer", answer: value.answer };
  }
  if (value.kind === "loop" && typeof value.loop === "string" && typeof value.agent === "string") {
    return { kind: "loop", loop: value.loop, agent: value.agent };
  }
  return null;
}

const answerStart = /^\s*\{\s*"kind"\s*:\s*"answer"\s*,\s*"answer"\s*:\s*"/;
const jsonText = /^(?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*/;

/** Reads the answer so far from a route still being written, or null when it is not an answer route. */
export function fromPartialRoute(text: string): string | null {
  const start = answerStart.exec(text);
  if (start === null) return null;
  const written = jsonText.exec(text.slice(start[0].length))?.[0] ?? "";
  try {
    const value: unknown = JSON.parse(`"${written}"`);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

/** Writes a loop route as a short label. */
export function toRouteLabel(route: Extract<Route, { kind: "loop" }>): string {
  return `Routed to ${route.agent.replaceAll("_", " ")}, ${route.loop} loop`;
}
