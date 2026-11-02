import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";

function toBootScript(): string {
  const html = readFileSync("index.html", "utf8");
  const match = /<script>([\s\S]*?)<\/script>/.exec(html);
  return match?.[1] ?? "";
}

describe("theme before first paint", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    window.localStorage.clear();
  });

  it("applies the remembered theme from an inline script in the page head", () => {
    window.localStorage.setItem("geomind.theme", "light");
    runInThisContext(toBootScript());
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("leaves the system choice to the operating system", () => {
    runInThisContext(toBootScript());
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });
});
