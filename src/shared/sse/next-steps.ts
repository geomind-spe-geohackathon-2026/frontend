/** A suggested next step: the chip's label and the message a click sends. */
export type NextStep = { label: string; message: string };

function isNextStep(item: unknown): item is NextStep {
  return (
    typeof item === "object" &&
    item !== null &&
    "label" in item &&
    "message" in item &&
    typeof item.label === "string" &&
    typeof item.message === "string" &&
    item.label !== "" &&
    item.message !== ""
  );
}

/** Reads up to three next steps from a server value; anything else gives none. */
export function toNextSteps(value: unknown): NextStep[] {
  return Array.isArray(value) ? value.filter(isNextStep).slice(0, 3) : [];
}

/** The next steps on an object that may carry them (a message, a run.finished event). */
export function nextStepsOf(holder: object): NextStep[] {
  return "suggestions" in holder ? toNextSteps(holder.suggestions) : [];
}
