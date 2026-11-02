const opens = new Set(["{", "[", "("]);
const closes = new Set(["}", "]", ")"]);

function toBreak(depth: number): string {
  return `\n${"  ".repeat(depth)}`;
}

/** Lays out a one-line tool result (a Python or JSON dict) as indented text. */
export function toPretty(summary: string): string {
  let depth = 0;
  let quote: string | null = null;
  let out = "";
  for (let index = 0; index < summary.length; index += 1) {
    const char = summary.charAt(index);
    if (quote !== null) {
      out += char;
      if (char === quote && summary[index - 1] !== "\\") quote = null;
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    if (opens.has(char)) {
      depth += 1;
      out += char + toBreak(depth);
    } else if (closes.has(char)) {
      depth = Math.max(0, depth - 1);
      out += toBreak(depth) + char;
    } else if (char === ",") {
      out += char + toBreak(depth);
    } else if (char === " " && summary[index - 1] === ",") {
      continue;
    } else {
      out += char;
    }
  }
  return out;
}
