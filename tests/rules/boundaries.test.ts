import { describe, expect, it } from "vitest";
import { findImports, findViolation, toTarget } from "./boundaries";
import { listFiles, toText } from "./files";

describe("import boundary rule", () => {
  it("lets a feature import shared code and itself", () => {
    expect(findViolation("src/domains/design/case/page.tsx", "src/shared/ui/button")).toBeNull();
    expect(
      findViolation("src/domains/design/case/page.tsx", "src/domains/design/case/api"),
    ).toBeNull();
  });

  it("forbids a feature importing another feature, even in the same domain", () => {
    expect(
      findViolation("src/domains/design/case/page.tsx", "src/domains/design/plant/api"),
    ).not.toBeNull();
    expect(
      findViolation("src/domains/design/case/page.tsx", "src/domains/identity/me/api"),
    ).not.toBeNull();
  });

  it("forbids shared importing domains or app, and features importing app", () => {
    expect(
      findViolation("src/shared/ui/button.tsx", "src/domains/design/case/page"),
    ).not.toBeNull();
    expect(findViolation("src/shared/ui/button.tsx", "src/app/router")).not.toBeNull();
    expect(findViolation("src/domains/design/case/page.tsx", "src/app/router")).not.toBeNull();
  });

  it("lets the app and a domain routes file import features", () => {
    expect(findViolation("src/app/router.tsx", "src/domains/design/routes")).toBeNull();
    expect(
      findViolation("src/domains/design/routes.ts", "src/domains/design/case/page"),
    ).toBeNull();
  });

  it("keeps mocks away from domains and the app", () => {
    expect(
      findViolation("src/mocks/workspace.ts", "src/domains/workspace/projects/api"),
    ).not.toBeNull();
    expect(findViolation("src/mocks/workspace.ts", "src/shared/api/types")).toBeNull();
  });

  it("finds static and dynamic imports", () => {
    const source = 'import a from "@/shared/a"; const b = () => import("./b");';
    expect(findImports("src/x.ts", source)).toEqual(["@/shared/a", "./b"]);
  });

  const files = listFiles(["src"], /\.(ts|tsx)$/);

  it.each(files)("%s respects the layers", (file) => {
    const problems = findImports(file, toText(file))
      .map((specifier) => toTarget(file, specifier))
      .filter((target) => target !== null)
      .map((target) => findViolation(file, target))
      .filter((problem) => problem !== null);
    expect(problems).toEqual([]);
  });

  it("has no barrel index files", () => {
    expect(listFiles(["src"], /(^|\/)index\.(ts|tsx)$/)).toEqual([]);
  });
});
