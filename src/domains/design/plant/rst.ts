export type InlinePart = { text: string; isCode: boolean };

const literal = /``(.+?)``/;

function stripMarkup(text: string): string {
  return text
    .replace(/:[a-z:]+:`~?([^`]+)`/g, "$1")
    .replace(/`([^`<]+?)\s*<[^>]*>`_{1,2}/g, "$1")
    .replace(/`([^`]+)`_{0,2}/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");
}

/** Reads the inline markup of an RST sentence: literals become code parts, other markup is stripped. */
export function toInlineParts(text: string): InlinePart[] {
  return text
    .split(new RegExp(literal.source, "g"))
    .map((part, index) =>
      index % 2 === 1 ? { text: part, isCode: true } : { text: stripMarkup(part), isCode: false },
    )
    .filter((part) => part.text !== "");
}
