import { describe, expect, it } from "vitest";
import { toText } from "./files";

const css = toText("src/styles/index.css");

function toTokens(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [match[1] ?? "", match[2] ?? ""]),
  );
}

function toBlock(start: string): string {
  const from = css.indexOf(start);
  const open = css.indexOf("{", from);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(open + 1, index);
  }
  throw new Error(`Block ${start} is not closed`);
}

const light = toTokens(toBlock(":root {"));
const mediaDark = toTokens(toBlock(':root:not([data-theme="light"])'));
const attributeDark = toTokens(toBlock(':root[data-theme="dark"]'));

const roles = [
  "background",
  "surface",
  "sunken",
  "border",
  "text",
  "muted",
  "accent",
  "ok",
  "warn",
  "bad",
  "hot",
  "heat",
  "cold",
  "power",
  "gas",
];

describe("design tokens", () => {
  it.each(roles)("defines %s in light and dark", (role) => {
    expect(light[`--${role}`]).toBeDefined();
    expect(mediaDark[`--${role}`]).toBeDefined();
  });

  it("keeps the system dark block and the explicit dark block identical", () => {
    expect(mediaDark).toEqual(attributeDark);
  });

  it("defines the same tokens in light and dark", () => {
    expect(Object.keys(mediaDark).sort()).toEqual(Object.keys(light).sort());
  });
});
