import { describe, expect, it } from "vitest";
import { findCommentProblems, findMissingDocs } from "./comments";
import { listFiles, toText } from "./files";

const sourceFiles = listFiles(["src", "tests", "e2e", "scripts"], /\.(ts|tsx|mjs)$/)
  .filter((file) => !file.startsWith("src/components/"))
  .concat(["eslint.config.js", "vite.config.ts", "playwright.config.ts"]);

describe("no comments rule", () => {
  it("accepts a one-line JSDoc above an export and an eslint directive", () => {
    const source =
      "/** Adds. */\nexport function add() {}\n// eslint-disable-next-line no-alert\nalert(1);\n";
    expect(findCommentProblems("a.ts", source)).toEqual([]);
  });

  it("rejects line comments, block comments, JSX comments and multi-line JSDoc", () => {
    const source = [
      "// note",
      "/* block */",
      "/**\n * long\n */\nexport const a = 1;",
      "const b = <div>{/* x */}</div>;",
      "function f() {} // trailing",
    ].join("\n");
    expect(findCommentProblems("a.tsx", source)).toHaveLength(5);
  });

  it("does not take comment signs inside strings, templates, regular expressions or JSX text", () => {
    const source =
      'const a = "// no"; const b = `/* no */`; const c = /\\/\\//; const d = <p>// no</p>;';
    expect(findCommentProblems("a.tsx", source)).toEqual([]);
  });

  it("flags an exported function without JSDoc", () => {
    expect(findMissingDocs("a.ts", "export function add() {}\n")).toEqual([1]);
    expect(findMissingDocs("a.ts", "/** Adds. */\nexport const add = () => 1;\n")).toEqual([]);
  });

  it.each(sourceFiles)("%s has no forbidden comments and documents its exports", (file) => {
    const source = toText(file);
    expect(findCommentProblems(file, source)).toEqual([]);
    expect(findMissingDocs(file, source)).toEqual([]);
  });
});

describe("rule inputs", () => {
  it("finds source files to check", () => {
    expect(sourceFiles.length).toBeGreaterThan(10);
  });
});
