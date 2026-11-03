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
    window.localStorage.setItem("geomind.theme", "dark");
    runInThisContext(toBootScript());
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("is light when no theme was chosen", () => {
    runInThisContext(toBootScript());
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("leaves a chosen system theme to the operating system", () => {
    window.localStorage.setItem("geomind.theme", "system");
    runInThisContext(toBootScript());
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });
});
