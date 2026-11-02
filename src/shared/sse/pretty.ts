const words: Record<string, string> = { None: "null", True: "true", False: "false" };

function readQuoted(text: string, start: number): { end: number; value: string } {
  const quote = text.charAt(start);
  let value = "";
  let index = start + 1;
  while (index < text.length && text.charAt(index) !== quote) {
    if (text.charAt(index) === "\\") {
      index += 1;
      value += text.charAt(index) === "'" ? "'" : `\\${text.charAt(index)}`;
    } else if (text.charAt(index) === '"') {
      value += '\\"';
    } else {
      value += text.charAt(index);
    }
    index += 1;
  }
  return { end: index + 1, value: `"${value}"` };
}

function toTokens(text: string): string {
  let out = "";
  let index = 0;
  while (index < text.length) {
    const char = text.charAt(index);
    if (char === "'" || char === '"') {
      const quoted = readQuoted(text, index);
      out += quoted.value;
      index = quoted.end;
      continue;
    }
    const word = /^(None|True|False)\b/.exec(text.slice(index));
    out += word === null ? char : (words[word[1] ?? ""] ?? char);
    index += word === null ? 1 : (word[1] ?? "").length;
  }
  return out;
}

function parse(text: string): unknown {
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return undefined;
  }
}

function closed(text: string): string {
  const open: string[] = [];
  let inString = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (char === "\\") index += 1;
    else if (char === '"') inString = !inString;
    else if (!inString && (char === "{" || char === "[")) open.push(char === "{" ? "}" : "]");
    else if (!inString && (char === "}" || char === "]")) open.pop();
  }
  return text.replace(/,?\s*("[^"]*"\s*:\s*)?$/, "") + open.reverse().join("");
}

function fromText(text: string): unknown {
  const tokens = toTokens(text);
  return parse(text) ?? parse(tokens) ?? parse(closed(tokens));
}

/** Lays out a tool result as indented JSON, a Python dict included; text that is neither stays as it is. */
export function toPretty(summary: string): string {
  const value = fromText(summary.trim());
  return value === undefined ? summary : JSON.stringify(value, null, 2);
}

function fromQuotedMessage(summary: string): string | null {
  const start = /['"]message['"]:\s*/.exec(summary);
  if (start === null) return null;
  const at = start.index + start[0].length;
  if (summary.charAt(at) !== "'" && summary.charAt(at) !== '"') return null;
  const value = parse(readQuoted(summary, at).value);
  return typeof value === "string" ? value : null;
}

/** Returns the message of a failed tool, read from a dict when the tool returned one. */
export function toFailureText(error: string): string {
  return fromQuotedMessage(error) ?? error;
}

function toCount(key: string, value: unknown): string | null {
  const words = key.replaceAll("_", " ");
  if (Array.isArray(value)) {
    const name = value.length === 1 && words.endsWith("s") ? words.slice(0, -1) : words;
    return `${String(value.length)} ${name}`;
  }
  if (typeof value === "string" || typeof value === "number") {
    return `${words} ${String(value).slice(0, 30)}`;
  }
  return null;
}

/** Writes a tool result as a few words: counts of its lists and its short values. */
export function toSummary(summary: string): string {
  const value = fromText(summary.trim());
  if (Array.isArray(value)) return `${String(value.length)} items`;
  if (value === undefined) return /^[[{(]/.test(summary.trim()) ? "See the details" : summary;
  if (typeof value !== "object" || value === null) return summary;
  const parts = Object.entries(value).flatMap(([key, item]) => toCount(key, item) ?? []);
  return parts.length === 0 ? "See the details" : parts.slice(0, 3).join(", ");
}

/** Writes a budget stop as a sentence, or nothing for any other failure. */
export function toBudgetStop(message: string): string | null {
  const found = /^project (cost|token) budget: \S+ used (\S+) of (\S+)$/.exec(message);
  if (found === null) return null;
  const unit = found[1] === "cost" ? " USD" : " tokens";
  const spent = Number(Number(found[2]).toPrecision(2));
  return `Stopped: this project reached its budget of ${found[3] ?? ""}${unit} (spent ${String(spent)}${unit}). Raise the budget in project settings to continue.`;
}

/** Writes a permission question as what was asked for. */
export function toRequestText(message: string): string {
  const found = /^Allow (\S+) \((\w+)\)\?$/.exec(message);
  if (found === null) return `You answered: ${message}`;
  const tool = (found[1] ?? "").replaceAll("_", " ");
  const effect = found[2] === "write" ? "writes to the project" : found[2];
  return `You answered: ${tool} (${effect ?? ""})`;
}
