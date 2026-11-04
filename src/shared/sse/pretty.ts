import type { ToolProblem } from "./types";

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

const noCaseMessage = "the problem state has no case";
const noCaseText =
  "The project's case is not complete yet, so the assistant cannot use it. Fill in the missing values on the Case page, then ask again.";

const incompleteText = "The project's case is missing values";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads the best value of a study from its tool summary, or null when it has none. */
export function toBestValue(summary: string): { value: number; unit: string } | null {
  const found = fromText(summary.trim());
  const best = isRecord(found) ? found.best : undefined;
  if (!isRecord(best) || typeof best.value !== "number") return null;
  return { value: best.value, unit: typeof best.unit === "string" ? best.unit : "" };
}

function fromQuotedMessage(summary: string): string | null {
  const start = /['"]message['"]:\s*/.exec(summary);
  if (start === null) return null;
  const at = start.index + start[0].length;
  if (summary.charAt(at) !== "'" && summary.charAt(at) !== '"') return null;
  const value = parse(readQuoted(summary, at).value);
  return typeof value === "string" ? value : null;
}

const problemTexts: Record<string, string> = {
  files_unavailable:
    "The project's documents could not be reached just now. Try again in a moment.",
  not_text: "This document has no readable text, so the assistant cannot read it.",
  budget: "The run used up its budget before this step.",
};

const toolLabels: Record<string, string> = {
  list_files: "Listed the project documents",
  read_document: "Read a document",
  rag_search: "Searched the files and Knowledge",
  rag_read: "Read a document",
  search_knowledge: "Searched the Knowledge",
  list_mcp: "Listed the connectors",
  save_mcp_table: "Saved a connector table to the case",
};

function toWords(name: string): string {
  const words = name.replaceAll("_", " ").replaceAll("-", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A tool's name for reading: a friendly label for known tools, an MCP tool (`server__tool`) with its connector, else the name in plain words. */
export function toToolName(tool: string): string {
  const label = toolLabels[tool];
  if (label !== undefined) return label;
  const split = tool.indexOf("__");
  if (split > 0) return `${toWords(tool.slice(split + 2))} (${tool.slice(0, split)})`;
  return toWords(tool);
}

const longestFailure = 400;
const schemaNote = /\s*The tool's input_schema:[\s\S]*$/;

function toShortFailure(text: string): string {
  const plain = text.replace(schemaNote, "");
  return plain.length > longestFailure ? `${plain.slice(0, longestFailure).trimEnd()}…` : plain;
}

function toProblemText(problem: ToolProblem): string {
  if (problem.code === "no_case") return noCaseText;
  if (problem.code === "nested_stopped") return `A helper agent stopped: ${problem.message}`;
  const known = problemTexts[problem.code];
  if (known !== undefined) return known;
  if (problem.code === "case_incomplete") {
    const missing = problem.suggestions.length > 0 ? problem.suggestions : [problem.path ?? ""];
    const listed = missing.filter((entry) => entry !== "").join(", ");
    return listed === ""
      ? `${incompleteText}.`
      : `${incompleteText}: ${listed}. Fill them in on the Case page, then ask again.`;
  }
  const message = toShortFailure(problem.message);
  return problem.path === null ? message : `${message} (${problem.path})`;
}

/** Returns the message of a failed tool: from its problem code when it has one, else read from the error text. */
export function toFailureText(error: string, problem: ToolProblem | null = null): string {
  if (problem !== null) return toProblemText(problem);
  const text = typeof error === "string" ? error : "";
  const message = fromQuotedMessage(text) ?? text;
  return message.includes(noCaseMessage) ? noCaseText : toShortFailure(message);
}

function toSingular(words: string): string {
  if (/(ch|sh|x|ss)es$/.test(words)) return words.slice(0, -2);
  return words.endsWith("s") ? words.slice(0, -1) : words;
}

function toCount(key: string, value: unknown, cut: boolean): string | null {
  const words = key.replaceAll("_", " ");
  if (Array.isArray(value)) {
    if (cut) return `${String(value.length)}+ ${words}`;
    const name = value.length === 1 ? toSingular(words) : words;
    return `${String(value.length)} ${name}`;
  }
  if (typeof value === "string" || typeof value === "number") {
    return `${words} ${String(value).slice(0, 30)}`;
  }
  return null;
}

/** Writes a tool result as a few words: counts of its lists and its short values. */
export function toSummary(summary: string): string {
  const text = summary.trim();
  const value = fromText(text);
  const cut = parse(text) === undefined && parse(toTokens(text)) === undefined;
  if (Array.isArray(value)) return `${String(value.length)}${cut ? "+" : ""} items`;
  if (value === undefined) return /^[[{(]/.test(text) ? "See the details" : summary;
  if (typeof value !== "object" || value === null) return summary;
  const parts = Object.entries(value).flatMap(([key, item]) => toCount(key, item, cut) ?? []);
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

/** Rounds long decimals in a text (48.699029126213595 becomes 48.7), so a question reads well. */
export function toRoundedText(text: string): string {
  return text.replace(/\d+\.\d{5,}(e[+-]?\d+)?/gi, (number) =>
    String(Number(Number(number).toPrecision(4))),
  );
}

/** Writes a permission question as what was asked for; any other question as the question itself. */
export function toRequestText(message: string): string {
  const found = /^Allow (\S+) \((\w+)\)\?$/.exec(message);
  if (found === null) return `You answered this question:\n${toRoundedText(message)}`;
  const tool = (found[1] ?? "").replaceAll("_", " ");
  const effect = found[2] === "write" ? "writes to the project" : found[2];
  return `You answered: ${tool} (${effect ?? ""})`;
}
