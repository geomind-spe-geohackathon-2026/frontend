import { posix } from "node:path";
import ts from "typescript";

type Zone = { layer: string; domain?: string; feature?: string };

const layers = ["app", "domains", "shared", "components", "mocks", "lib", "testing"];

function toZone(path: string): Zone | null {
  const [layer, domain, feature] = path.replace(/^src\//, "").split("/");
  if (layer === undefined || !layers.includes(layer)) return null;
  if (layer !== "domains") return { layer };
  const isFeature = feature !== undefined && !feature.includes(".");
  return { layer, ...(domain === undefined ? {} : { domain }), ...(isFeature ? { feature } : {}) };
}

function resolveImport(from: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return `src/${specifier.slice(2)}`;
  if (specifier.startsWith(".")) return posix.join(posix.dirname(from), specifier);
  return null;
}

const allowed: Record<string, string[]> = {
  shared: ["shared", "components", "lib"],
  components: ["components", "lib"],
  lib: ["lib"],
  domains: ["shared", "components", "lib", "domains"],
  mocks: ["shared", "lib", "mocks"],
  app: ["shared", "components", "lib", "domains", "app"],
  testing: layers,
};

/** Tells why importing `to` from `from` breaks the layer rules, or null when it is allowed. */
export function findViolation(from: string, to: string): string | null {
  const source = toZone(from);
  const target = toZone(to);
  if (source === null || target === null) return null;
  if (/\.test\.tsx?$/.test(from) && ["testing", "mocks"].includes(target.layer)) return null;
  if (!allowed[source.layer]?.includes(target.layer)) {
    return `${source.layer} must not import ${target.layer}`;
  }
  const sameDomain = source.domain === target.domain;
  if (source.layer === "domains" && target.layer === "domains" && source.feature !== undefined) {
    const sameFeature = sameDomain && source.feature === target.feature;
    if (!sameFeature) return "a feature may import only shared code and itself";
  }
  return null;
}

/** Lists the import specifiers of a source file, static and dynamic. */
export function findImports(file: string, source: string): string[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      found.push(node.moduleSpecifier.text);
    }
    const dynamic =
      ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword;
    const argument = ts.isCallExpression(node) ? node.arguments[0] : undefined;
    if (dynamic && argument !== undefined && ts.isStringLiteral(argument))
      found.push(argument.text);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

/** Resolves an import of a file to a project path, or null for packages. */
export function toTarget(from: string, specifier: string): string | null {
  return resolveImport(from, specifier);
}
